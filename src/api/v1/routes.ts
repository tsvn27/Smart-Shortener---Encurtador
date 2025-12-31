import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { linkRepository } from '../../repositories/link-repository.js';
import { clickRepository } from '../../repositories/click-repository.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { requireAuth, requirePermission, generateToken, hashPassword, verifyPassword } from '../middleware/auth.js';
import { queryOne, queryAll, execute } from '../../db/index.js';

const router = Router();

// Auth schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

// Auth routes
router.post('/auth/register', validateBody(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;
  
  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  
  const id = nanoid();
  const passwordHash = await hashPassword(password);
  
  execute(
    'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
    [id, email, passwordHash, name]
  );
  
  const token = generateToken(id);
  const user = queryOne('SELECT * FROM users WHERE id = ?', [id]);
  
  res.status(201).json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        maxLinks: user.max_links,
        maxApiKeys: user.max_api_keys,
        maxWebhooks: user.max_webhooks,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    },
  });
});

router.post('/auth/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  
  const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = generateToken(user.id);
  
  res.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        maxLinks: user.max_links,
        maxApiKeys: user.max_api_keys,
        maxWebhooks: user.max_webhooks,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    },
  });
});

router.get('/auth/me', requireAuth, (req, res) => {
  const user = req.user!;
  res.json({
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      maxLinks: user.maxLinks,
      maxApiKeys: user.maxApiKeys,
      maxWebhooks: user.maxWebhooks,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

// Dashboard stats
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
    const { limit, offset } = req.query as z.infer<typeof listQuerySchema>;
    const links = linkRepository.findByOwner(req.user!.id, limit, offset);
    res.json({ data: links, meta: { limit, offset, count: links.length } });
  }
);

router.post('/links',
  requireAuth,
  requirePermission('links:write'),
  validateBody(createLinkSchema),
  (req, res) => {
    const data = req.body as z.infer<typeof createLinkSchema>;
    
    if (data.customCode) {
      const existing = linkRepository.findByShortCode(data.customCode);
      if (existing) {
        return res.status(409).json({ error: 'Short code already taken' });
      }
    }
    
    const link = linkRepository.create({
      originalUrl: data.url,
      ownerId: req.user!.id,
      customCode: data.customCode,
      rules: data.rules,
      limits: data.limits,
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
      rules: data.rules,
      limits: data.limits,
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
    
    const { limit, offset } = req.query as z.infer<typeof listQuerySchema>;
    const clicks = clickRepository.findByLink(link.id, limit, offset);
    
    res.json({ data: clicks, meta: { limit, offset, count: clicks.length } });
  }
);

export default router;
