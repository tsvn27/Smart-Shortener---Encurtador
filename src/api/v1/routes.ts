import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { createHash, randomBytes } from 'crypto';
import { linkRepository } from '../../repositories/link-repository.js';
import { clickRepository } from '../../repositories/click-repository.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { requireAuth, requirePermission, generateToken, hashPassword, verifyPassword, validatePassword, validateEmail, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { queryOne, queryAll, execute } from '../../db/index.js';
import { validateUrl, sanitizeUrl } from '../../lib/url-validator.js';
import { sendPasswordResetEmail } from '../../lib/email.js';
import { logger } from '../../lib/logger.js';
import { sanitizeInput, getClientIP, recordSuspiciousActivity } from '../../lib/security.js';
import { authLimiter, createLinkLimiter, passwordResetLimiter, apiKeyLimiter, searchLimiter } from '../../lib/rate-limiter.js';

const router = Router();

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  plan: string;
  max_links: number;
  max_api_keys: number;
  max_webhooks: number;
  created_at: string;
  updated_at: string;
}

interface ApiKeyRow {
  id: string;
  key_hash: string;
  name: string;
  owner_id: string;
  permissions_json: string;
  last_used_at: string | null;
  created_at: string;
}

interface WebhookRow {
  id: string;
  owner_id: string;
  url: string;
  secret: string;
  events_json: string;
  active: number;
  created_at: string;
}

interface PasswordResetRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: number;
}

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(6).max(128),
});

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

router.post('/auth/register', authLimiter, validateBody(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;
  const ip = getClientIP(req);
  
  const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
  const sanitizedName = sanitizeInput(name.trim());
  
  if (!validateEmail(sanitizedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.message });
  }
  
  const existing = queryOne<UserRow>('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  
  const id = nanoid();
  const passwordHash = await hashPassword(password);
  
  execute(
    'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
    [id, sanitizedEmail, passwordHash, sanitizedName]
  );
  
  const token = generateToken(id);
  const user = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [id])!;
  
  setAuthCookie(res, token);
  logger.info(`New user registered: ${sanitizedEmail}`, { ip });
  
  res.status(201).json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    },
  });
});

router.post('/auth/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const ip = getClientIP(req);
  
  const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
  
  const user = queryOne<UserRow>('SELECT * FROM users WHERE email = ?', [sanitizedEmail]);
  if (!user) {
    logger.warn(`Failed login attempt for non-existent email`, { ip });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    logger.warn(`Failed login attempt for ${sanitizedEmail}`, { ip });
    recordSuspiciousActivity(ip);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = generateToken(user.id);
  setAuthCookie(res, token);
  logger.info(`User logged in: ${sanitizedEmail}`, { ip });
  
  res.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    },
  });
});

router.post('/auth/logout', requireAuth, (req, res) => {
  clearAuthCookie(res);
  res.json({ data: { message: 'Logged out successfully' } });
});

const forgotPasswordSchema = z.object({
  email: z.string().email().max(254),
});

router.post('/auth/forgot-password', passwordResetLimiter, validateBody(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  const ip = getClientIP(req);
  
  const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
  const user = queryOne<UserRow>('SELECT * FROM users WHERE email = ?', [sanitizedEmail]);
  
  res.json({ data: { message: 'If the email exists, a reset link will be sent' } });
  
  if (!user) {
    logger.info(`Password reset requested for non-existent email`, { ip });
    return;
  }
  
  const existingReset = queryOne<PasswordResetRow>(
    'SELECT * FROM password_resets WHERE user_id = ? AND used = 0 AND expires_at > ?',
    [user.id, new Date().toISOString()]
  );
  
  if (existingReset) {
    logger.info(`Password reset already pending for ${sanitizedEmail}`, { ip });
    return;
  }
  
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  
  execute(
    'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    [nanoid(), user.id, token, expiresAt]
  );
  
  logger.info(`Password reset token generated for ${sanitizedEmail}`, { ip });
  await sendPasswordResetEmail(sanitizedEmail, token);
});

const resetPasswordSchema = z.object({
  token: z.string().min(64).max(64),
  password: z.string().min(8).max(128),
});

router.post('/auth/reset-password', passwordResetLimiter, validateBody(resetPasswordSchema), async (req, res) => {
  const { token, password } = req.body;
  const ip = getClientIP(req);
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.message });
  }
  
  const reset = queryOne<PasswordResetRow>(
    'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > ?',
    [token, new Date().toISOString()]
  );
  
  if (!reset) {
    logger.warn(`Invalid password reset attempt`, { ip });
    recordSuspiciousActivity(ip);
    return res.status(400).json({ error: 'Invalid or expired token' });
  }
  
  const passwordHash = await hashPassword(password);
  
  execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', 
    [passwordHash, new Date().toISOString(), reset.user_id]);
  execute('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);
  execute('DELETE FROM password_resets WHERE user_id = ? AND id != ?', [reset.user_id, reset.id]);
  
  logger.info(`Password reset completed for user ${reset.user_id}`, { ip });
  
  res.json({ data: { message: 'Password reset successfully' } });
});

router.get('/auth/me', requireAuth, (req, res) => {
  const user = req.user!;
  res.json({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

router.post('/auth/change-password', requireAuth, authLimiter, validateBody(changePasswordSchema), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.id;
  const ip = getClientIP(req);
  
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.message });
  }
  
  const user = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) {
    logger.warn(`Failed password change attempt for user ${userId}`, { ip });
    recordSuspiciousActivity(ip);
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  const newPasswordHash = await hashPassword(newPassword);
  execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newPasswordHash, new Date().toISOString(), userId]);
  
  clearAuthCookie(res);
  logger.info(`Password changed for user ${userId}`, { ip });
  
  res.json({ data: { message: 'Password changed successfully' } });
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
});

router.patch('/auth/profile', requireAuth, validateBody(updateProfileSchema), (req, res) => {
  const { name } = req.body;
  const userId = req.user!.id;
  
  if (name) {
    execute('UPDATE users SET name = ?, updated_at = ? WHERE id = ?', [name, new Date().toISOString(), userId]);
  }
  
  const user = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [userId])!;
  
  res.json({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  });
});

router.delete('/auth/account', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  
  execute('DELETE FROM click_events WHERE link_id IN (SELECT id FROM links WHERE owner_id = ?)', [userId]);
  execute('DELETE FROM links WHERE owner_id = ?', [userId]);
  execute('DELETE FROM api_keys WHERE owner_id = ?', [userId]);
  execute('DELETE FROM webhooks WHERE owner_id = ?', [userId]);
  execute('DELETE FROM users WHERE id = ?', [userId]);
  
  res.status(204).send();
});

router.get('/stats/public', searchLimiter, (_, res) => {
  const totalLinks = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM links');
  const totalClicks = queryOne<{ total: number }>('SELECT COALESCE(SUM(total_clicks), 0) as total FROM links');
  const totalUsers = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
  
  res.json({
    data: {
      totalLinks: totalLinks?.count || 0,
      totalClicks: totalClicks?.total || 0,
      totalUsers: totalUsers?.count || 0,
    },
  });
});

router.get('/stats/dashboard', requireAuth, (req, res) => {
  const userId = req.user!.id;
  
  const linksCount = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM links WHERE owner_id = ?',
    [userId]
  );
  
  const clicksTotal = queryOne<{ total: number }>(
    'SELECT COALESCE(SUM(total_clicks), 0) as total FROM links WHERE owner_id = ?',
    [userId]
  );
  
  const clicksToday = queryOne<{ total: number }>(
    'SELECT COALESCE(SUM(clicks_today), 0) as total FROM links WHERE owner_id = ?',
    [userId]
  );
  
  const linkIds = queryAll<{ id: string }>(
    'SELECT id FROM links WHERE owner_id = ?',
    [userId]
  ).map(r => r.id);
  
  let botsBlocked = 0;
  if (linkIds.length > 0) {
    const placeholders = linkIds.map(() => '?').join(',');
    const bots = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM click_events WHERE link_id IN (${placeholders}) AND is_bot = 1`,
      linkIds
    );
    botsBlocked = bots?.count || 0;
  }
  
  const clicksByDay = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    
    let clicks = 0;
    if (linkIds.length > 0) {
      const placeholders = linkIds.map(() => '?').join(',');
      const result = queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM click_events WHERE link_id IN (${placeholders}) AND date(timestamp) = ?`,
        [...linkIds, dateStr]
      );
      clicks = result?.count || 0;
    }
    
    clicksByDay.push({ date: dayLabel, clicks });
  }
  
  res.json({
    data: {
      totalLinks: linksCount?.count || 0,
      totalClicks: clicksTotal?.total || 0,
      clicksToday: clicksToday?.total || 0,
      botsBlocked,
      clicksByDay,
    },
  });
});

const createLinkSchema = z.object({
  url: z.string().url(),
  customCode: z.string().min(3).max(32).optional(),
  rules: z.array(z.object({
    id: z.string(),
    priority: z.number(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['eq', 'neq', 'in', 'nin', 'gt', 'lt', 'gte', 'lte', 'contains']),
      value: z.union([z.string(), z.number(), z.array(z.string())]),
    })),
    targetUrl: z.string().url(),
    active: z.boolean(),
  })).optional(),
  limits: z.object({
    maxClicks: z.number().optional(),
    maxClicksPerDay: z.number().optional(),
    expiresAt: z.string().datetime().optional(),
    validFrom: z.string().datetime().optional(),
    allowedCountries: z.array(z.string()).optional(),
    blockedCountries: z.array(z.string()).optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  campaign: z.string().optional(),
});

const updateLinkSchema = createLinkSchema.partial();

const listQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  state: z.enum(['active', 'paused', 'expired', 'dead', 'viral']).optional(),
});

router.get('/links',
  requireAuth,
  requirePermission('links:read'),
  validateQuery(listQuerySchema),
  (req, res) => {
    const { limit, offset } = req.query as unknown as { limit: number; offset: number };
    const links = linkRepository.findByOwner(req.user!.id, limit, offset);
    res.json({ data: links, meta: { limit, offset, count: links.length } });
  }
);

router.post('/links',
  requireAuth,
  requirePermission('links:write'),
  createLinkLimiter,
  validateBody(createLinkSchema),
  (req, res) => {
    const data = req.body as z.infer<typeof createLinkSchema>;
    
    const urlValidation = validateUrl(data.url);
    if (!urlValidation.valid) {
      return res.status(400).json({ error: urlValidation.error });
    }
    
    const sanitizedUrl = sanitizeUrl(data.url);
    
    if (data.customCode) {
      const existing = linkRepository.findByShortCode(data.customCode);
      if (existing) {
        return res.status(409).json({ error: 'Short code already taken' });
      }
    }
    
    const link = linkRepository.create({
      originalUrl: sanitizedUrl,
      ownerId: req.user!.id,
      customCode: data.customCode,
      rules: data.rules as any,
      limits: data.limits as any,
      tags: data.tags,
      campaign: data.campaign,
    });
    
    res.status(201).json({ data: link });
  }
);

router.get('/links/:id',
  requireAuth,
  requirePermission('links:read'),
  (req, res) => {
    const link = linkRepository.findById(req.params.id);
    
    if (!link) return res.status(404).json({ error: 'Link not found' });
    if (link.ownerId !== req.user!.id) return res.status(403).json({ error: 'Access denied' });
    
    res.json({ data: link });
  }
);

router.patch('/links/:id',
  requireAuth,
  requirePermission('links:write'),
  validateBody(updateLinkSchema),
  (req, res) => {
    const link = linkRepository.findById(req.params.id);
    
    if (!link) return res.status(404).json({ error: 'Link not found' });
    if (link.ownerId !== req.user!.id) return res.status(403).json({ error: 'Access denied' });
    
    const data = req.body as z.infer<typeof updateLinkSchema>;
    const updated = linkRepository.update(req.params.id, {
      defaultTargetUrl: data.url,
      rules: data.rules as any,
      limits: data.limits as any,
      tags: data.tags,
      campaign: data.campaign,
    });
    
    res.json({ data: updated });
  }
);

router.delete('/links/:id',
  requireAuth,
  requirePermission('links:delete'),
  (req, res) => {
    const link = linkRepository.findById(req.params.id);
    
    if (!link) return res.status(404).json({ error: 'Link not found' });
    if (link.ownerId !== req.user!.id) return res.status(403).json({ error: 'Access denied' });
    
    linkRepository.delete(req.params.id);
    res.status(204).send();
  }
);

router.post('/links/:id/pause',
  requireAuth,
  requirePermission('links:write'),
  (req, res) => {
    const link = linkRepository.findById(req.params.id);
    
    if (!link || link.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const updated = linkRepository.update(req.params.id, { state: 'paused' });
    res.json({ data: updated });
  }
);

router.post('/links/:id/activate',
  requireAuth,
  requirePermission('links:write'),
  (req, res) => {
    const link = linkRepository.findById(req.params.id);
    
    if (!link || link.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const updated = linkRepository.update(req.params.id, { state: 'active' });
    res.json({ data: updated });
  }
);

router.get('/links/:id/analytics',
  requireAuth,
  requirePermission('analytics:read'),
  (req, res) => {
    const link = linkRepository.findById(req.params.id);
    
    if (!link || link.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const analytics = {
      totalClicks: link.totalClicks,
      uniqueClicks: link.uniqueClicks,
      clicksToday: link.clicksToday,
      byCountry: clickRepository.getClicksByCountry(link.id),
      byDevice: clickRepository.getClicksByDevice(link.id),
      byHour: clickRepository.getClicksByHour(link.id),
      botClicks: clickRepository.getBotClicks(link.id),
      suspiciousClicks: clickRepository.getSuspiciousClicks(link.id),
    };
    
    res.json({ data: analytics });
  }
);

router.get('/links/:id/clicks',
  requireAuth,
  requirePermission('analytics:read'),
  validateQuery(listQuerySchema),
  (req, res) => {
    const link = linkRepository.findById(req.params.id);
    
    if (!link || link.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const { limit, offset } = req.query as unknown as { limit: number; offset: number };
    const clicks = clickRepository.findByLink(link.id, limit, offset);
    
    res.json({ data: clicks, meta: { limit, offset, count: clicks.length } });
  }
);

router.get('/links/:id/export',
  requireAuth,
  requirePermission('analytics:read'),
  (req, res) => {
    const link = linkRepository.findById(req.params.id);
    
    if (!link || link.ownerId !== req.user!.id) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const clicks = clickRepository.findByLink(link.id, 10000, 0);
    
    const headers = ['Data', 'País', 'Dispositivo', 'Navegador', 'Referrer', 'Bot', 'Suspeito'];
    const rows = clicks.map(c => [
      c.timestamp,
      c.country || '',
      c.device,
      c.browser,
      c.referrer || 'Direto',
      c.isBot ? 'Sim' : 'Não',
      c.isSuspicious ? 'Sim' : 'Não',
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${link.shortCode}-analytics.csv"`);
    res.send(csv);
  }
);

const createApiKeySchema = z.object({
  name: z.string().min(1).max(50),
  permissions: z.array(z.string()).default(['links:read']),
});

router.get('/api-keys', requireAuth, searchLimiter, (req, res) => {
  const keys = queryAll<ApiKeyRow>(
    'SELECT id, name, permissions_json, last_used_at, created_at FROM api_keys WHERE owner_id = ? AND active = 1',
    [req.user!.id]
  );
  
  res.json({
    data: keys.map(k => ({
      id: k.id,
      name: k.name,
      lastChars: k.id.slice(-4),
      permissions: JSON.parse(k.permissions_json),
      lastUsed: k.last_used_at,
      createdAt: k.created_at,
    })),
  });
});

router.post('/api-keys', requireAuth, apiKeyLimiter, validateBody(createApiKeySchema), (req, res) => {
  const { name, permissions } = req.body;
  const ip = getClientIP(req);
  
  const sanitizedName = sanitizeInput(name.trim());
  
  const existingCount = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM api_keys WHERE owner_id = ? AND active = 1',
    [req.user!.id]
  );
  
  if ((existingCount?.count || 0) >= 10) {
    return res.status(400).json({ error: 'Maximum API keys limit reached (10)' });
  }
  
  const id = nanoid();
  const rawKey = `sk_live_${nanoid(32)}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  
  execute(
    'INSERT INTO api_keys (id, key_hash, name, owner_id, permissions_json) VALUES (?, ?, ?, ?, ?)',
    [id, keyHash, sanitizedName, req.user!.id, JSON.stringify(permissions)]
  );
  
  logger.info(`API key created for user ${req.user!.id}`, { ip });
  
  res.status(201).json({
    data: {
      id,
      name: sanitizedName,
      key: rawKey,
      permissions,
      createdAt: new Date().toISOString(),
    },
  });
});

router.delete('/api-keys/:id', requireAuth, (req, res) => {
  const key = queryOne<ApiKeyRow>(
    'SELECT * FROM api_keys WHERE id = ? AND owner_id = ?',
    [req.params.id, req.user!.id]
  );
  
  if (!key) {
    return res.status(404).json({ error: 'API key not found' });
  }
  
  execute('UPDATE api_keys SET active = 0 WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

router.get('/webhooks', requireAuth, (req, res) => {
  const webhooks = queryAll<WebhookRow>(
    'SELECT * FROM webhooks WHERE owner_id = ?',
    [req.user!.id]
  );
  
  res.json({
    data: webhooks.map(w => ({
      id: w.id,
      url: w.url,
      events: JSON.parse(w.events_json),
      active: w.active === 1,
      createdAt: w.created_at,
    })),
  });
});

router.post('/webhooks', requireAuth, validateBody(createWebhookSchema), (req, res) => {
  const { url, events } = req.body;
  
  const id = nanoid();
  const secret = nanoid(32);
  
  execute(
    'INSERT INTO webhooks (id, owner_id, url, secret, events_json) VALUES (?, ?, ?, ?, ?)',
    [id, req.user!.id, url, secret, JSON.stringify(events)]
  );
  
  res.status(201).json({
    data: {
      id,
      url,
      events,
      secret,
      active: true,
      createdAt: new Date().toISOString(),
    },
  });
});

router.patch('/webhooks/:id', requireAuth, (req, res) => {
  const webhook = queryOne<WebhookRow>(
    'SELECT * FROM webhooks WHERE id = ? AND owner_id = ?',
    [req.params.id, req.user!.id]
  );
  
  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  
  const { active } = req.body;
  if (typeof active === 'boolean') {
    execute('UPDATE webhooks SET active = ? WHERE id = ?', [active ? 1 : 0, req.params.id]);
  }
  
  res.json({
    data: {
      id: webhook.id,
      url: webhook.url,
      events: JSON.parse(webhook.events_json),
      active: active ?? webhook.active === 1,
    },
  });
});

router.delete('/webhooks/:id', requireAuth, (req, res) => {
  const webhook = queryOne<WebhookRow>(
    'SELECT * FROM webhooks WHERE id = ? AND owner_id = ?',
    [req.params.id, req.user!.id]
  );
  
  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  
  execute('DELETE FROM webhooks WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

export default router;
