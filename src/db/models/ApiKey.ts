import mongoose, { Schema } from 'mongoose';

export interface IApiKey {
  _id: string;
  keyHash: string;
  name: string;
  ownerId: string;
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  lastUsedAt?: Date;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
}

const apiKeySchema = new Schema<IApiKey>({
  _id: { type: String, required: true },
  keyHash: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true, ref: 'User' },
  permissions: { type: [String], default: ['links:read'] },
  rateLimit: {
    type: {
      requestsPerMinute: { type: Number, default: 60 },
      requestsPerHour: { type: Number, default: 1000 },
      requestsPerDay: { type: Number, default: 10000 },
    },
    default: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000 },
  },
  lastUsedAt: { type: Date },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  _id: false,
});

apiKeySchema.index({ ownerId: 1 });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema);
