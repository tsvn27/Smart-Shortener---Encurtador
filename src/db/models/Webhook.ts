import mongoose, { Schema } from 'mongoose';

export interface IWebhook {
  _id: string;
  ownerId: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  maxRetries: number;
  retryDelayMs: number;
  totalDeliveries: number;
  failedDeliveries: number;
  lastDeliveryAt?: Date;
  createdAt: Date;
}

const webhookSchema = new Schema<IWebhook>({
  _id: { type: String, required: true },
  ownerId: { type: String, required: true, ref: 'User' },
  url: { type: String, required: true },
  secret: { type: String, required: true },
  events: { type: [String], default: [] },
  active: { type: Boolean, default: true },
  maxRetries: { type: Number, default: 3 },
  retryDelayMs: { type: Number, default: 1000 },
  totalDeliveries: { type: Number, default: 0 },
  failedDeliveries: { type: Number, default: 0 },
  lastDeliveryAt: { type: Date },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  _id: false,
});

webhookSchema.index({ ownerId: 1 });

export const Webhook = mongoose.model<IWebhook>('Webhook', webhookSchema);
