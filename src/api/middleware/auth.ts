import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { User, ApiKey } from '../../db/index.js';
import { getClientIP, recordSuspiciousActivity, sanitizeInput } from '../../lib/security.js';
import { logger } from '../../lib/logger.js';
import type { User as UserType, ApiKey as ApiKeyType, ApiPermission } from '../../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const COOKIE_NAME = 'auth_session';
const isProduction = process.env.NODE_ENV === 'production';

declare global {
  namespace Express {
    interface Request {
      user?: UserType;
      apiKey?: ApiKeyType;
      sessionId?: string;
    }
  }
}

const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

function checkLockout(identifier: string): { locked: boolean; remainingTime?: number } {
  const record = failedAttempts.get(identifier);
  if (!record) return { locked: false };
  
  const timeSinceLastAttempt = Date.now() - record.lastAttempt;
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    failedAttempts.delete(identifier);
    return { locked: false };
  }
  
  if (record.count >= LOCKOUT_THRESHOLD) {
    return { locked: true, remainingTime: LOCKOUT_DURATION - timeSinceLastAttempt };
  }
  
  return { locked: false };
}

function recordFailedAttempt(identifier: string) {
  const record = failedAttempts.get(identifier) || { count: 0, lastAttempt: Date.now() };
  record.count++;
  record.lastAttempt = Date.now();
  failedAttempts.set(identifier, record);
}

function clearFailedAttempts(identifier: string) {
  failedAttempts.delete(identifier);
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    signed: true,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIP(req);
  
  const lockout = checkLockout(ip);
  if (lockout.locked) {
    return res.status(429).json({ 
      error: 'Muitas tentativas falhas. Tente novamente mais tarde.',
      retryAfter: Math.ceil((lockout.remainingTime || 0) / 1000)
    });
  }
  
  const cookieToken = req.signedCookies?.[COOKIE_NAME];
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  
  if (cookieToken) {
    token = cookieToken;
  } else if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }
  
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId?: string };
      const user = await User.findById(payload.userId);
      
      if (user) {
        req.user = {
          id: user._id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        req.sessionId = payload.sessionId;
        clearFailedAttempts(ip);
        return next();
      }
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        clearAuthCookie(res);
        return res.status(401).json({ error: 'Sessão expirada' });
      }
      recordFailedAttempt(ip);
      logger.warn(`Invalid token from ${ip}`);
    }
  }

  const apiKeyHeader = req.headers['x-api-key'] as string;
  
  if (apiKeyHeader) {
    const sanitizedKey = sanitizeInput(apiKeyHeader);
    if (sanitizedKey.length < 32 || sanitizedKey.length > 128) {
      recordSuspiciousActivity(ip);
      return res.status(401).json({ error: 'Formato de chave API inválido' });
    }
    
    const keyHash = createHash('sha256').update(sanitizedKey).digest('hex');
    const apiKey = await ApiKey.findOne({ keyHash, active: true });
    
    if (apiKey) {
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return res.status(401).json({ error: 'Chave API expirada' });
      }
      
      await ApiKey.findByIdAndUpdate(apiKey._id, { lastUsedAt: new Date() });
      
      const user = await User.findById(apiKey.ownerId);
      
      if (user) {
        req.user = {
          id: user._id,
          email: user.email,
          passwordHash: user.passwordHash,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        req.apiKey = {
          id: apiKey._id,
          key: '',
          keyHash: apiKey.keyHash,
          name: apiKey.name,
          ownerId: apiKey.ownerId,
          permissions: apiKey.permissions as ApiPermission[],
          rateLimit: apiKey.rateLimit,
          lastUsedAt: apiKey.lastUsedAt,
          expiresAt: apiKey.expiresAt,
          active: apiKey.active,
          createdAt: apiKey.createdAt,
        };
        clearFailedAttempts(ip);
        return next();
      }
    } else {
      recordFailedAttempt(ip);
      recordSuspiciousActivity(ip);
      logger.warn(`Invalid API key attempt from ${ip}`);
    }
  }
  
  recordFailedAttempt(ip);
  return res.status(401).json({ error: 'Autenticação necessária' });
}

export function requirePermission(permission: ApiPermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) return next();
    
    if (!req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Permissões insuficientes',
        required: permission,
      });
    }
    
    next();
  };
}

export function generateToken(userId: string): string {
  const sessionId = randomBytes(16).toString('hex');
  return jwt.sign({ userId, sessionId }, JWT_SECRET, { expiresIn: '7d' });
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.compare(password, hash);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Senha muito longa' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter uma letra minúscula' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'A senha deve conter uma letra maiúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'A senha deve conter um número' };
  }
  return { valid: true };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of failedAttempts.entries()) {
    if (now - record.lastAttempt > LOCKOUT_DURATION) {
      failedAttempts.delete(key);
    }
  }
}, 60000);
