import mongoose, { Schema } from 'mongoose';

export interface ILink {
  _id: string;
  shortCode: string;
  originalUrl: string;
  defaultTargetUrl: string;
  ownerId: string;
  state: 'active' | 'paused' | 'expired' | 'dead' | 'viral';
  healthScore: number;
  trustScore: number;
  rules: any[];
  scripts: any[];
  limits: any;
  tags: string[];
  campaign?: string;
  abTestId?: string;
  totalClicks: number;
  uniqueClicks: number;
  clicksToday: number;
  lastClickAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const linkSchema = new Schema<ILink>({
  _id: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true },
  defaultTargetUrl: { type: String, required: true },
  ownerId: { type: String, required: true, ref: 'User' },
  state: { type: String, enum: ['active', 'paused', 'expired', 'dead', 'viral'], default: 'active' },
  healthScore: { type: Number, default: 100 },
  trustScore: { type: Number, default: 100 },
  rules: { type: Schema.Types.Mixed, default: [] },
  scripts: { type: Schema.Types.Mixed, default: [] },
  limits: { type: Schema.Types.Mixed, default: {} },
  tags: { type: [String], default: [] },
  campaign: { type: String },
  abTestId: { type: String },
  totalClicks: { type: Number, default: 0 },
  uniqueClicks: { type: Number, default: 0 },
  clicksToday: { type: Number, default: 0 },
  lastClickAt: { type: Date },
}, {
  timestamps: true,
  _id: false,
});

linkSchema.index({ shortCode: 1 });
linkSchema.index({ ownerId: 1 });
linkSchema.index({ state: 1 });

export const Link = mongoose.model<ILink>('Link', linkSchema);
