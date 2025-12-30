import { nanoid } from 'nanoid';
import { execute, queryAll } from '../db/index.js';
import type { AuditLog } from '../types/index.js';

interface AuditLogRow {
  id: string;
  user_id: string;
  api_key_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  details_json: string;
  ip: string | null;
  user_agent: string | null;
  timestamp: string;
}

export class AuditService {
  
  log(data: {
    userId: string;
    apiKeyId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }): void {
    const id = nanoid();
    
    execute(
      `INSERT INTO audit_logs (id, user_id, api_key_id, action, resource, resource_id, details_json, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.userId, data.apiKeyId || null, data.action, data.resource, data.resourceId || null, JSON.stringify(data.details || {}), data.ip || null, data.userAgent || null]
    );
  }
  
  getByUser(userId: string, limit = 100, offset = 0): AuditLog[] {
    const rows = queryAll<AuditLogRow>(`SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?`, [userId, limit, offset]);
    return rows.map(this.rowToAuditLog);
  }
  
  getByResource(resource: string, resourceId: string, limit = 100): AuditLog[] {
    const rows = queryAll<AuditLogRow>(`SELECT * FROM audit_logs WHERE resource = ? AND resource_id = ? ORDER BY timestamp DESC LIMIT ?`, [resource, resourceId, limit]);
    return rows.map(this.rowToAuditLog);
  }
  
  getByApiKey(apiKeyId: string, limit = 100): AuditLog[] {
    const rows = queryAll<AuditLogRow>(`SELECT * FROM audit_logs WHERE api_key_id = ? ORDER BY timestamp DESC LIMIT ?`, [apiKeyId, limit]);
    return rows.map(this.rowToAuditLog);
  }
  
  private rowToAuditLog(row: AuditLogRow): AuditLog {
    return {
      id: row.id,
      userId: row.user_id,
      apiKeyId: row.api_key_id || undefined,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id || '',
      details: JSON.parse(row.details_json),
      ip: row.ip || '',
      userAgent: row.user_agent || '',
      timestamp: new Date(row.timestamp),
    };
  }
}

export const auditService = new AuditService();

export const AuditActions = {
  LINK_CREATED: 'link.created',
  LINK_UPDATED: 'link.updated',
  LINK_DELETED: 'link.deleted',
  LINK_PAUSED: 'link.paused',
  LINK_ACTIVATED: 'link.activated',
  API_KEY_CREATED: 'api_key.created',
  API_KEY_REVOKED: 'api_key.revoked',
  WEBHOOK_CREATED: 'webhook.created',
  WEBHOOK_DELETED: 'webhook.deleted',
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
} as const;
