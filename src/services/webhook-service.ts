import { createHmac } from 'crypto';
import { queryAll, execute } from '../db/index.js';
import type { Webhook, WebhookEvent } from '../types/index.js';

interface WebhookRow {
  id: string;
  owner_id: string;
  url: string;
  secret: string;
  events_json: string;
  active: number;
  max_retries: number;
  retry_delay_ms: number;
  total_deliveries: number;
  failed_deliveries: number;
  last_delivery_at: string | null;
  created_at: string;
}

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

export class WebhookService {
  
  async trigger(ownerId: string, event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
    const webhooks = this.getActiveWebhooks(ownerId, event);
    
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    
    for (const webhook of webhooks) {
      this.deliver(webhook, payload).catch(() => {});
    }
  }
  
  private async deliver(webhook: Webhook, payload: WebhookPayload, attempt = 1): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = this.sign(body, webhook.secret);
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      this.recordSuccess(webhook.id);
      
    } catch (error) {
      if (attempt < webhook.maxRetries) {
        const delay = webhook.retryDelayMs * Math.pow(2, attempt - 1);
        await this.sleep(delay);
        return this.deliver(webhook, payload, attempt + 1);
      }
      
      this.recordFailure(webhook.id);
      throw error;
    }
  }
  
  private sign(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }
  
  private getActiveWebhooks(ownerId: string, event: WebhookEvent): Webhook[] {
    const rows = queryAll<WebhookRow>('SELECT * FROM webhooks WHERE owner_id = ? AND active = 1', [ownerId]);
    return rows.map(this.rowToWebhook).filter(w => w.events.includes(event));
  }
  
  private rowToWebhook(row: WebhookRow): Webhook {
    return {
      id: row.id,
      ownerId: row.owner_id,
      url: row.url,
      secret: row.secret,
      events: JSON.parse(row.events_json),
      active: row.active === 1,
      maxRetries: row.max_retries,
      retryDelayMs: row.retry_delay_ms,
      totalDeliveries: row.total_deliveries,
      failedDeliveries: row.failed_deliveries,
      lastDeliveryAt: row.last_delivery_at ? new Date(row.last_delivery_at) : undefined,
      createdAt: new Date(row.created_at),
    };
  }
  
  private recordSuccess(webhookId: string): void {
    execute(`UPDATE webhooks SET total_deliveries = total_deliveries + 1, last_delivery_at = CURRENT_TIMESTAMP WHERE id = ?`, [webhookId]);
  }
  
  private recordFailure(webhookId: string): void {
    execute(`UPDATE webhooks SET total_deliveries = total_deliveries + 1, failed_deliveries = failed_deliveries + 1, last_delivery_at = CURRENT_TIMESTAMP WHERE id = ?`, [webhookId]);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const webhookService = new WebhookService();
