import { nanoid } from 'nanoid';
import { Link, ILink } from '../db/index.js';
import type { Link as LinkType, RedirectRule, LinkLimits } from '../types/index.js';

function toLink(doc: ILink): LinkType {
  return {
    id: doc._id,
    shortCode: doc.shortCode,
    originalUrl: doc.originalUrl,
    defaultTargetUrl: doc.defaultTargetUrl,
    ownerId: doc.ownerId,
    state: doc.state,
    healthScore: doc.healthScore,
    trustScore: doc.trustScore,
    rules: doc.rules as RedirectRule[],
    scripts: doc.scripts,
    limits: doc.limits as LinkLimits,
    tags: doc.tags,
    campaign: doc.campaign,
    abTestId: doc.abTestId,
    totalClicks: doc.totalClicks,
    uniqueClicks: doc.uniqueClicks,
    clicksToday: doc.clicksToday,
    lastClickAt: doc.lastClickAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const linkRepository = {
  async findById(id: string): Promise<LinkType | null> {
    const doc = await Link.findById(id);
    return doc ? toLink(doc) : null;
  },

  async findByShortCode(shortCode: string): Promise<LinkType | null> {
    const doc = await Link.findOne({ shortCode });
    return doc ? toLink(doc) : null;
  },

  async findByOwner(ownerId: string, limit = 20, offset = 0): Promise<LinkType[]> {
    const docs = await Link.find({ ownerId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    return docs.map(toLink);
  },

  async create(data: {
    originalUrl: string;
    ownerId: string;
    customCode?: string;
    rules?: RedirectRule[];
    limits?: LinkLimits;
    tags?: string[];
    campaign?: string;
  }): Promise<LinkType> {
    const id = nanoid();
    const shortCode = data.customCode || nanoid(8);

    const doc = await Link.create({
      _id: id,
      shortCode,
      originalUrl: data.originalUrl,
      defaultTargetUrl: data.originalUrl,
      ownerId: data.ownerId,
      rules: data.rules || [],
      limits: data.limits || {},
      tags: data.tags || [],
      campaign: data.campaign,
    });

    return toLink(doc);
  },

  async update(id: string, data: Partial<{
    defaultTargetUrl: string;
    state: string;
    rules: RedirectRule[];
    limits: LinkLimits;
    tags: string[];
    campaign: string;
  }>): Promise<LinkType | null> {
    const doc = await Link.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    return doc ? toLink(doc) : null;
  },

  async delete(id: string): Promise<void> {
    await Link.findByIdAndDelete(id);
  },

  async incrementClicks(id: string): Promise<void> {
    await Link.findByIdAndUpdate(id, {
      $inc: { totalClicks: 1, clicksToday: 1 },
      $set: { lastClickAt: new Date() },
    });
  },

  async incrementUniqueClicks(id: string): Promise<void> {
    await Link.findByIdAndUpdate(id, {
      $inc: { uniqueClicks: 1 },
    });
  },

  async resetDailyClicks(): Promise<void> {
    await Link.updateMany({}, { $set: { clicksToday: 0 } });
  },
};
