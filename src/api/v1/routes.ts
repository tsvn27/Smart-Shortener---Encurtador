import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { createHash, randomBytes } from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { User, Link, ClickEvent, ApiKey, Webhook, PasswordReset } from '../../db/index.js';
import { linkRepository } from '../../repositories/link-repository.js';
import { clickRepository } from '../../repositories/click-repository.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { requireAuth, requirePermission, generateToken, hashPassword, verifyPassword, validatePassword, validateEmail, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { validateUrl, sanitizeUrl } from '../../lib/url-validator.js';
import { sendPasswordResetEmail } from '../../lib/email.js';
import { logger } from '../../lib/logger.js';
import { sanitizeInput, getClientIP, recordSuspiciousActivity } from '../../lib/security.js';
import { authLimiter, createLinkLimiter, passwordResetLimiter, apiKeyLimiter, searchLimiter } from '../../lib/rate-limiter.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(6).max(128),
  twoFACode: z.string().length(6).optional(),
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
    return res.status(400).json({ error: 'Formato de email inválido' });
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ error: passwordValidation.message });
  }

  const existing = await User.findOne({ email: sanitizedEmail });
  if (existing) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }
  
  const id = nanoid();
  const passwordHash = await hashPassword(password);
  
  const user = await User.create({
    _id: id,
    email: sanitizedEmail,
    passwordHash,
    name: sanitizedName,
  });
  
  const token = generateToken(id);
  setAuthCookie(res, token);
  logger.info(`New user registered: ${sanitizedEmail}`, { ip });
  
  res.status(201).json({
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        twoFAEnabled: user.twoFAEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

router.post('/auth/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password, twoFACode } = req.body;
  const ip = getClientIP(req);
  
  const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
  
  const user = await User.findOne({ email: sanitizedEmail });
  if (!user) {
    logger.warn(`Failed login attempt for non-existent email`, { ip });
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }
  
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    logger.warn(`Failed login attempt for ${sanitizedEmail}`, { ip });
    recordSuspiciousActivity(ip);
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }

  if (user.twoFAEnabled) {
    if (!twoFACode) {
      return res.status(200).json({ 
        data: { requires2FA: true, message: 'Código 2FA necessário' } 
      });
    }
    
    const isValid2FA = authenticator.verify({ token: twoFACode, secret: user.twoFASecret! });
    if (!isValid2FA) {
      logger.warn(`Failed 2FA attempt for ${sanitizedEmail}`, { ip });
      recordSuspiciousActivity(ip);
      return res.status(401).json({ error: 'Código 2FA inválido' });
    }
  }
  
  const token = generateToken(user._id);
  setAuthCookie(res, token);
  logger.info(`User logged in: ${sanitizedEmail}`, { ip });
  
  res.json({
    data: {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        twoFAEnabled: user.twoFAEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
  });
});

router.post('/auth/logout', requireAuth, (_req, res) => {
  clearAuthCookie(res);
  res.json({ data: { message: 'Logout realizado com sucesso' } });
});

const forgotPasswordSchema = z.object({ email: z.string().email().max(254) });

router.post('/auth/forgot-password', passwordResetLimiter, validateBody(forgotPasswordSchema), async (req, res) => {
  const { email } = req.body;
  const ip = getClientIP(req);
  
  const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
  const user = await User.findOne({ email: sanitizedEmail });
  
  res.json({ data: { message: 'Se o email existir, um link de recuperação será enviado' } });
  
  if (!user) {
    logger.info(`Password reset requested for non-existent email`, { ip });
    return;
  }

  const existingReset = await PasswordReset.findOne({
    userId: user._id,
    used: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (existingReset) {
    logger.info(`Password reset already pending for ${sanitizedEmail}`, { ip });
    return;
  }
  
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  await PasswordReset.create({
    _id: nanoid(),
    userId: user._id,
    token,
    expiresAt,
  });
  
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
  
  const reset = await PasswordReset.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (!reset) {
    logger.warn(`Invalid password reset attempt`, { ip });
    recordSuspiciousActivity(ip);
    return res.status(400).json({ error: 'Token inválido ou expirado' });
  }
  
  const passwordHash = await hashPassword(password);
  
  await User.findByIdAndUpdate(reset.userId, { passwordHash });
  await PasswordReset.findByIdAndUpdate(reset._id, { used: true });
  await PasswordReset.deleteMany({ userId: reset.userId, _id: { $ne: reset._id } });
  
  logger.info(`Password reset completed for user ${reset.userId}`, { ip });
  res.json({ data: { message: 'Senha redefinida com sucesso' } });
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  
  res.json({
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      twoFAEnabled: user.twoFAEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

const avatarSchema = z.object({ avatar: z.string().max(500000) });

router.post('/auth/avatar', requireAuth, validateBody(avatarSchema), async (req, res) => {
  const { avatar } = req.body;
  const userId = req.user!.id;
  
  if (!avatar.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Formato de imagem inválido' });
  }
  
  const sizeInBytes = Buffer.byteLength(avatar, 'utf8');
  if (sizeInBytes > 500000) {
    return res.status(400).json({ error: 'Imagem muito grande (máx 500KB)' });
  }
  
  await User.findByIdAndUpdate(userId, { avatar });
  res.json({ data: { avatar } });
});

router.delete('/auth/avatar', requireAuth, async (req, res) => {
  await User.findByIdAndUpdate(req.user!.id, { $unset: { avatar: 1 } });
  res.json({ data: { message: 'Avatar removido' } });
});

router.get('/auth/2fa/status', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.id);
  res.json({ data: { enabled: user?.twoFAEnabled || false } });
});

router.post('/auth/2fa/setup', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.id);
  
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (user.twoFAEnabled) return res.status(400).json({ error: '2FA já está ativado' });
  
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, 'Smart Shortener', secret);
  
  try {
    const qrCode = await QRCode.toDataURL(otpauth);
    await User.findByIdAndUpdate(user._id, { twoFASecret: secret });
    res.json({ data: { secret, qrCode, otpauth } });
  } catch {
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

const verify2FASchema = z.object({ code: z.string().length(6) });

router.post('/auth/2fa/verify', requireAuth, validateBody(verify2FASchema), async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user!.id);
  
  if (!user?.twoFASecret) return res.status(400).json({ error: 'Configure o 2FA primeiro' });
  if (user.twoFAEnabled) return res.status(400).json({ error: '2FA já está ativado' });
  
  const isValid = authenticator.verify({ token: code, secret: user.twoFASecret });
  if (!isValid) return res.status(400).json({ error: 'Código inválido' });
  
  await User.findByIdAndUpdate(user._id, { twoFAEnabled: true });
  res.json({ data: { message: '2FA ativado com sucesso' } });
});

router.post('/auth/2fa/disable', requireAuth, validateBody(verify2FASchema), async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user!.id);
  
  if (!user?.twoFAEnabled) return res.status(400).json({ error: '2FA não está ativado' });
  
  const isValid = authenticator.verify({ token: code, secret: user.twoFASecret! });
  if (!isValid) return res.status(400).json({ error: 'Código inválido' });
  
  await User.findByIdAndUpdate(user._id, { twoFAEnabled: false, $unset: { twoFASecret: 1 } });
  res.json({ data: { message: '2FA desativado com sucesso' } });
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
  
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    logger.warn(`Failed password change attempt for user ${userId}`, { ip });
    recordSuspiciousActivity(ip);
    return res.status(401).json({ error: 'Senha atual incorreta' });
  }
  
  const newPasswordHash = await hashPassword(newPassword);
  await User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });
  
  clearAuthCookie(res);
  logger.info(`Password changed for user ${userId}`, { ip });
  res.json({ data: { message: 'Senha alterada com sucesso' } });
});

const updateProfileSchema = z.object({ name: z.string().min(2).optional() });

router.patch('/auth/profile', requireAuth, validateBody(updateProfileSchema), async (req, res) => {
  const { name } = req.body;
  if (name) await User.findByIdAndUpdate(req.user!.id, { name });
  
  const user = await User.findById(req.user!.id);
  res.json({
    data: {
      id: user!._id,
      email: user!.email,
      name: user!.name,
      createdAt: user!.createdAt,
      updatedAt: user!.updatedAt,
    },
  });
});

router.delete('/auth/account', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  
  const links = await Link.find({ ownerId: userId });
  for (const link of links) {
    await ClickEvent.deleteMany({ linkId: link._id });
  }
  
  await Link.deleteMany({ ownerId: userId });
  await ApiKey.deleteMany({ ownerId: userId });
  await Webhook.deleteMany({ ownerId: userId });
  await User.findByIdAndDelete(userId);
  
  res.status(204).send();
});

router.get('/stats/public', searchLimiter, async (_req, res) => {
  const totalLinks = await Link.countDocuments();
  const totalUsers = await User.countDocuments();
  const linksAgg = await Link.aggregate([{ $group: { _id: null, total: { $sum: '$totalClicks' } } }]);
  const totalClicks = linksAgg[0]?.total || 0;
  
  res.json({ data: { totalLinks, totalClicks, totalUsers } });
});

router.get('/stats/dashboard', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  
  const linksCount = await Link.countDocuments({ ownerId: userId });
  const linksAgg = await Link.aggregate([
    { $match: { ownerId: userId } },
    { $group: { _id: null, totalClicks: { $sum: '$totalClicks' }, clicksToday: { $sum: '$clicksToday' } } }
  ]);
  
  const totalClicks = linksAgg[0]?.totalClicks || 0;
  const clicksToday = linksAgg[0]?.clicksToday || 0;
  
  const links = await Link.find({ ownerId: userId });
  const linkIds = links.map(l => l._id);
  
  const botsBlocked = linkIds.length > 0 
    ? await ClickEvent.countDocuments({ linkId: { $in: linkIds }, isBot: true })
    : 0;

  const clicksByDay = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    
    const clicks = linkIds.length > 0 
      ? await clickRepository.getClicksForDate(linkIds, dateStr)
      : 0;
    
    clicksByDay.push({ date: dayLabel, clicks });
  }
  
  res.json({ data: { totalLinks: linksCount, totalClicks, clicksToday, botsBlocked, clicksByDay } });
});

const createLinkSchema = z.object({
  url: z.string().url(),
  customCode: z.string().min(3).max(32).optional(),
  rules: z.array(z.any()).optional(),
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
});

router.get('/links', requireAuth, requirePermission('links:read'), validateQuery(listQuerySchema), async (req, res) => {
  const { limit, offset } = req.query as unknown as { limit: number; offset: number };
  const links = await linkRepository.findByOwner(req.user!.id, limit, offset);
  res.json({ data: links, meta: { limit, offset, count: links.length } });
});

router.post('/links', requireAuth, requirePermission('links:write'), createLinkLimiter, validateBody(createLinkSchema), async (req, res) => {
  const data = req.body;
  
  const urlValidation = validateUrl(data.url);
  if (!urlValidation.valid) return res.status(400).json({ error: urlValidation.error });
  
  const sanitizedUrl = sanitizeUrl(data.url);
  
  if (data.customCode) {
    const existing = await linkRepository.findByShortCode(data.customCode);
    if (existing) return res.status(409).json({ error: 'Código já está em uso' });
  }
  
  const link = await linkRepository.create({
    originalUrl: sanitizedUrl,
    ownerId: req.user!.id,
    customCode: data.customCode,
    rules: data.rules,
    limits: data.limits,
    tags: data.tags,
    campaign: data.campaign,
  });
  
  res.status(201).json({ data: link });
});

router.get('/links/:id', requireAuth, requirePermission('links:read'), async (req, res) => {
  const link = await linkRepository.findById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link não encontrado' });
  if (link.ownerId !== req.user!.id) return res.status(403).json({ error: 'Acesso negado' });
  res.json({ data: link });
});

router.patch('/links/:id', requireAuth, requirePermission('links:write'), validateBody(updateLinkSchema), async (req, res) => {
  const link = await linkRepository.findById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link não encontrado' });
  if (link.ownerId !== req.user!.id) return res.status(403).json({ error: 'Acesso negado' });
  
  const data = req.body;
  const updated = await linkRepository.update(req.params.id, {
    defaultTargetUrl: data.url,
    rules: data.rules,
    limits: data.limits,
    tags: data.tags,
    campaign: data.campaign,
  });
  
  res.json({ data: updated });
});

router.delete('/links/:id', requireAuth, requirePermission('links:delete'), async (req, res) => {
  const link = await linkRepository.findById(req.params.id);
  if (!link) return res.status(404).json({ error: 'Link não encontrado' });
  if (link.ownerId !== req.user!.id) return res.status(403).json({ error: 'Acesso negado' });
  
  await clickRepository.deleteByLink(req.params.id);
  await linkRepository.delete(req.params.id);
  res.status(204).send();
});

router.post('/links/:id/pause', requireAuth, requirePermission('links:write'), async (req, res) => {
  const link = await linkRepository.findById(req.params.id);
  if (!link || link.ownerId !== req.user!.id) return res.status(404).json({ error: 'Link não encontrado' });
  
  const updated = await linkRepository.update(req.params.id, { state: 'paused' });
  res.json({ data: updated });
});

router.post('/links/:id/activate', requireAuth, requirePermission('links:write'), async (req, res) => {
  const link = await linkRepository.findById(req.params.id);
  if (!link || link.ownerId !== req.user!.id) return res.status(404).json({ error: 'Link não encontrado' });
  
  const updated = await linkRepository.update(req.params.id, { state: 'active' });
  res.json({ data: updated });
});

router.get('/links/:id/analytics', requireAuth, requirePermission('analytics:read'), async (req, res) => {
  const link = await linkRepository.findById(req.params.id);
  if (!link || link.ownerId !== req.user!.id) return res.status(404).json({ error: 'Link não encontrado' });
  
  const analytics = {
    totalClicks: link.totalClicks,
    uniqueClicks: link.uniqueClicks,
    clicksToday: link.clicksToday,
    byCountry: await clickRepository.getClicksByCountry(link.id),
    byDevice: await clickRepository.getClicksByDevice(link.id),
    byHour: await clickRepository.getClicksByHour(link.id),
    botClicks: await clickRepository.getBotClicks(link.id),
    suspiciousClicks: await clickRepository.getSuspiciousClicks(link.id),
  };
  
  res.json({ data: analytics });
});

router.get('/links/:id/clicks', requireAuth, requirePermission('analytics:read'), validateQuery(listQuerySchema), async (req, res) => {
  const link = await linkRepository.findById(req.params.id);
  if (!link || link.ownerId !== req.user!.id) return res.status(404).json({ error: 'Link não encontrado' });
  
  const { limit, offset } = req.query as unknown as { limit: number; offset: number };
  const clicks = await clickRepository.findByLink(link.id, limit, offset);
  res.json({ data: clicks, meta: { limit, offset, count: clicks.length } });
});

router.get('/links/:id/export', requireAuth, requirePermission('analytics:read'), async (req, res) => {
  const link = await linkRepository.findById(req.params.id);
  if (!link || link.ownerId !== req.user!.id) return res.status(404).json({ error: 'Link não encontrado' });
  
  const clicks = await clickRepository.findByLink(link.id, 10000, 0);
  
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
});

const createApiKeySchema = z.object({
  name: z.string().min(1).max(50),
  permissions: z.array(z.string()).default(['links:read']),
});

router.get('/api-keys', requireAuth, searchLimiter, async (req, res) => {
  const keys = await ApiKey.find({ ownerId: req.user!.id, active: true });
  
  res.json({
    data: keys.map(k => ({
      id: k._id,
      name: k.name,
      lastChars: k._id.slice(-4),
      permissions: k.permissions,
      lastUsed: k.lastUsedAt,
      createdAt: k.createdAt,
    })),
  });
});

router.post('/api-keys', requireAuth, apiKeyLimiter, validateBody(createApiKeySchema), async (req, res) => {
  const { name, permissions } = req.body;
  const ip = getClientIP(req);
  
  const sanitizedName = sanitizeInput(name.trim());
  const existingCount = await ApiKey.countDocuments({ ownerId: req.user!.id, active: true });
  
  if (existingCount >= 10) {
    return res.status(400).json({ error: 'Limite máximo de chaves API atingido (10)' });
  }
  
  const id = nanoid();
  const rawKey = `sk_live_${nanoid(32)}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  
  await ApiKey.create({
    _id: id,
    keyHash,
    name: sanitizedName,
    ownerId: req.user!.id,
    permissions,
  });
  
  logger.info(`API key created for user ${req.user!.id}`, { ip });
  
  res.status(201).json({
    data: { id, name: sanitizedName, key: rawKey, permissions, createdAt: new Date().toISOString() },
  });
});

router.delete('/api-keys/:id', requireAuth, async (req, res) => {
  const key = await ApiKey.findOne({ _id: req.params.id, ownerId: req.user!.id });
  if (!key) return res.status(404).json({ error: 'Chave API não encontrada' });
  
  await ApiKey.findByIdAndUpdate(req.params.id, { active: false });
  res.status(204).send();
});

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

router.get('/webhooks', requireAuth, async (req, res) => {
  const webhooks = await Webhook.find({ ownerId: req.user!.id });
  
  res.json({
    data: webhooks.map(w => ({
      id: w._id,
      url: w.url,
      events: w.events,
      active: w.active,
      createdAt: w.createdAt,
    })),
  });
});

router.post('/webhooks', requireAuth, validateBody(createWebhookSchema), async (req, res) => {
  const { url, events } = req.body;
  
  const id = nanoid();
  const secret = nanoid(32);
  
  await Webhook.create({
    _id: id,
    ownerId: req.user!.id,
    url,
    secret,
    events,
  });
  
  res.status(201).json({
    data: { id, url, events, secret, active: true, createdAt: new Date().toISOString() },
  });
});

router.patch('/webhooks/:id', requireAuth, async (req, res) => {
  const webhook = await Webhook.findOne({ _id: req.params.id, ownerId: req.user!.id });
  if (!webhook) return res.status(404).json({ error: 'Webhook não encontrado' });
  
  const { active } = req.body;
  if (typeof active === 'boolean') {
    await Webhook.findByIdAndUpdate(req.params.id, { active });
  }
  
  res.json({
    data: { id: webhook._id, url: webhook.url, events: webhook.events, active: active ?? webhook.active },
  });
});

router.delete('/webhooks/:id', requireAuth, async (req, res) => {
  const webhook = await Webhook.findOne({ _id: req.params.id, ownerId: req.user!.id });
  if (!webhook) return res.status(404).json({ error: 'Webhook não encontrado' });
  
  await Webhook.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

export default router;
