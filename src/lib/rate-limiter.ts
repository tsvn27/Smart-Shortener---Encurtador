import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { getClientIP, generateFingerprint } from './security.js';

const keyGenerator = (req: Request): string => {
  const ip = getClientIP(req);
  const fingerprint = generateFingerprint(req);
  return `${ip}:${fingerprint}`;
};

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisições, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: (req) => req.path === '/health',
});

export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Limite de requisições excedido' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login, tente novamente em 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skipSuccessfulRequests: false,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Muitas tentativas de recuperação de senha, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const createLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Limite de criação de links atingido, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Limite de criação de chaves API atingido' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const redirectLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Muitas requisições' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Limite de upload atingido' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Limite de busca atingido' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});
