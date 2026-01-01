import mongoose, { Schema } from 'mongoose';

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  twoFASecret?: string;
  twoFAEnabled: boolean;
  plan: string;
  maxLinks: number;
  maxApiKeys: number;
  maxWebhooks: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  avatar: { type: String },
  twoFASecret: { type: String },
  twoFAEnabled: { type: Boolean, default: false },
  plan: { type: String, default: 'free' },
  maxLinks: { type: Number, default: 100 },
  maxApiKeys: { type: Number, default: 5 },
  maxWebhooks: { type: Number, default: 3 },
}, {
  timestamps: true,
  _id: false,
});

export const User = mongoose.model<IUser>('User', userSchema);
