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
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: (req) => req.path === '/health',
});

export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skipSuccessfulRequests: false,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many password reset attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const createLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Link creation limit reached, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'API key creation limit reached' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const redirectLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Upload limit reached' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Search limit reached' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});
