import mongoose, { Schema } from 'mongoose';
import { nanoid } from 'nanoid';
import type { AuditLog } from '../types/index.js';

interface IAuditLog {
  _id: string;
  userId?: string;
  apiKeyId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  _id: { type: String, required: true },
  userId: { type: String, ref: 'User' },
  apiKeyId: { type: String, ref: 'ApiKey' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String },
  details: { type: Schema.Types.Mixed, default: {} },
  ip: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: false,
  _id: false,
});

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export class AuditService {
  
  async log(data: {
    userId?: string;
    apiKeyId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }): Promise<void> {
    await AuditLogModel.create({
      _id: nanoid(),
      ...data,
      details: data.details || {},
    });
  }
  
  async getByUser(userId: string, limit = 100, offset = 0): Promise<AuditLog[]> {
    const docs = await AuditLogModel.find({ userId })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit);
    return docs.map(this.toAuditLog);
  }
  
  async getByResource(resource: string, resourceId: string, limit = 100): Promise<AuditLog[]> {
    const docs = await AuditLogModel.find({ resource, resourceId })
      .sort({ timestamp: -1 })
      .limit(limit);
    return docs.map(this.toAuditLog);
  }
  
  async getByApiKey(apiKeyId: string, limit = 100): Promise<AuditLog[]> {
    const docs = await AuditLogModel.find({ apiKeyId })
      .sort({ timestamp: -1 })
      .limit(limit);
    return docs.map(this.toAuditLog);
  }
  
  private toAuditLog(doc: IAuditLog): AuditLog {
    return {
      id: doc._id,
      userId: doc.userId,
      apiKeyId: doc.apiKeyId,
      action: doc.action,
      resource: doc.resource,
      resourceId: doc.resourceId,
      details: doc.details,
      ip: doc.ip,
      userAgent: doc.userAgent,
      timestamp: doc.timestamp,
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
  API_KEY_DELETED: 'api_key.deleted',
  WEBHOOK_CREATED: 'webhook.created',
  WEBHOOK_DELETED: 'webhook.deleted',
};
