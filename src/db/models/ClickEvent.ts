import mongoose, { Schema } from 'mongoose';

export interface IClickEvent {
  _id: string;
  linkId: string;
  timestamp: Date;
  ip: string;
  ipHash: string;
  userAgent: string;
  fingerprint: string;
  country?: string;
  city?: string;
  device: string;
  os: string;
  browser: string;
  language?: string;
  referrer?: string;
  isBot: boolean;
  isSuspicious: boolean;
  fraudScore: number;
  fraudReasons: string[];
  redirectedTo: string;
  ruleApplied?: string;
  responseTimeMs: number;
}

const clickEventSchema = new Schema<IClickEvent>({
  _id: { type: String, required: true },
  linkId: { type: String, required: true, ref: 'Link' },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, required: true },
  ipHash: { type: String, required: true },
  userAgent: { type: String },
  fingerprint: { type: String },
  country: { type: String },
  city: { type: String },
  device: { type: String },
  os: { type: String },
  browser: { type: String },
  language: { type: String },
  referrer: { type: String },
  isBot: { type: Boolean, default: false },
  isSuspicious: { type: Boolean, default: false },
  fraudScore: { type: Number, default: 0 },
  fraudReasons: { type: [String], default: [] },
  redirectedTo: { type: String, required: true },
  ruleApplied: { type: String },
  responseTimeMs: { type: Number },
}, {
  timestamps: false,
  _id: false,
});

clickEventSchema.index({ linkId: 1 });
clickEventSchema.index({ timestamp: -1 });
clickEventSchema.index({ ipHash: 1 });

export const ClickEvent = mongoose.model<IClickEvent>('ClickEvent', clickEventSchema);
