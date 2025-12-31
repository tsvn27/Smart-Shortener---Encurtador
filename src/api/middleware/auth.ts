import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { queryOne, execute } from '../../db/index.js';
import type { User, ApiKey, ApiPermission } from '../../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      apiKey?: ApiKey;
    }
  }
}

interface ApiKeyRow {
  id: string;
  key_hash: string;
  name: string;
  owner_id: string;
  permissions_json: string;
  rate_limit_json: string;
  last_used_at: string | null;
  expires_at: string | null;
  active: number;
  created_at: string;
}

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

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [payload.userId]);
      
      if (user) {
        req.user = rowToUser(user);
        return next();
      }
    } catch {}
  }
  
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey) {
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const keyRow = queryOne<ApiKeyRow>('SELECT * FROM api_keys WHERE key_hash = ? AND active = 1', [keyHash]);
    
    if (keyRow) {
      if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
        return res.status(401).json({ error: 'API key expired' });
      }
      
      execute('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?', [keyRow.id]);
      
      const user = queryOne<UserRow>('SELECT * FROM users WHERE id = ?', [keyRow.owner_id]);
      
      if (user) {
        req.user = rowToUser(user);
        req.apiKey = rowToApiKey(keyRow);
        return next();
      }
    }
  }
  
  return res.status(401).json({ error: 'Authentication required' });
}

export function requirePermission(permission: ApiPermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) return next();
    
    const permissions = req.apiKey.permissions;
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        available: permissions,
      });
    }
    
    next();
  };
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.compare(password, hash);
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    key: '',
    keyHash: row.key_hash,
    name: row.name,
    ownerId: row.owner_id,
    permissions: JSON.parse(row.permissions_json),
    rateLimit: JSON.parse(row.rate_limit_json),
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    active: row.active === 1,
    createdAt: new Date(row.created_at),
  };
}
