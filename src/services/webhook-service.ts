import { createHmac } from 'crypto';
import { Webhook, IWebhook } from '../db/index.js';
import { logger } from '../lib/logger.js';
import type { WebhookEvent } from '../types/index.js';

interface WebhookPayload {
  event: WebhookEvent;
  data: Record<string, unknown>;
  timestamp: string;
}

export class WebhookService {
  
  async trigger(ownerId: string, event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
    const webhooks = await this.getActiveWebhooks(ownerId, event);
    
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    
    for (const webhook of webhooks) {
      this.deliver(webhook, payload).catch(() => {});
    }
  }
  
  private async deliver(webhook: IWebhook, payload: WebhookPayload, attempt = 1): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = this.sign(body, webhook.secret);
    
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      await this.recordSuccess(webhook._id);
    } catch (error) {
      logger.warn(`Webhook delivery failed for ${webhook._id}`, { attempt, error });
      
      if (attempt < webhook.maxRetries) {
        await this.sleep(webhook.retryDelayMs * attempt);
        return this.deliver(webhook, payload, attempt + 1);
      }
      
      await this.recordFailure(webhook._id);
    }
  }
  
  private sign(body: string, secret: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
  }
  
  private async getActiveWebhooks(ownerId: string, event: WebhookEvent): Promise<IWebhook[]> {
    const webhooks = await Webhook.find({ ownerId, active: true });
    return webhooks.filter(w => w.events.includes(event));
  }
  
  private async recordSuccess(webhookId: string): Promise<void> {
    await Webhook.findByIdAndUpdate(webhookId, {
      $inc: { totalDeliveries: 1 },
      lastDeliveryAt: new Date(),
    });
  }
  
  private async recordFailure(webhookId: string): Promise<void> {
    await Webhook.findByIdAndUpdate(webhookId, {
      $inc: { totalDeliveries: 1, failedDeliveries: 1 },
      lastDeliveryAt: new Date(),
    });
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const webhookService = new WebhookService();
