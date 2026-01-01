import { nanoid } from 'nanoid';
import { ClickEvent, IClickEvent } from '../db/index.js';
import type { ClickEvent as ClickEventType } from '../types/index.js';

function toClickEvent(doc: IClickEvent): ClickEventType {
  return {
    id: doc._id,
    linkId: doc.linkId,
    timestamp: doc.timestamp,
    ip: doc.ip,
    ipHash: doc.ipHash,
    userAgent: doc.userAgent,
    fingerprint: doc.fingerprint,
    country: doc.country,
    city: doc.city,
    device: doc.device,
    os: doc.os,
    browser: doc.browser,
    language: doc.language,
    referrer: doc.referrer,
    isBot: doc.isBot,
    isSuspicious: doc.isSuspicious,
    fraudScore: doc.fraudScore,
    fraudReasons: doc.fraudReasons,
    redirectedTo: doc.redirectedTo,
    ruleApplied: doc.ruleApplied,
    responseTimeMs: doc.responseTimeMs,
  };
}

export const clickRepository = {
  async create(data: Omit<ClickEventType, 'id' | 'timestamp'>): Promise<ClickEventType> {
    const doc = await ClickEvent.create({
      _id: nanoid(),
      ...data,
      timestamp: new Date(),
    });
    return toClickEvent(doc);
  },

  async findByLink(linkId: string, limit = 20, offset = 0): Promise<ClickEventType[]> {
    const docs = await ClickEvent.find({ linkId })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit);
    return docs.map(toClickEvent);
  },

  async hasClickedBefore(linkId: string, ipHash: string): Promise<boolean> {
    const count = await ClickEvent.countDocuments({ linkId, ipHash });
    return count > 0;
  },

  async getClicksByCountry(linkId: string): Promise<Record<string, number>> {
    const result = await ClickEvent.aggregate([
      { $match: { linkId } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
    ]);
    return result.reduce((acc, { _id, count }) => {
      if (_id) acc[_id] = count;
      return acc;
    }, {} as Record<string, number>);
  },

  async getClicksByDevice(linkId: string): Promise<Record<string, number>> {
    const result = await ClickEvent.aggregate([
      { $match: { linkId } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ]);
    return result.reduce((acc, { _id, count }) => {
      if (_id) acc[_id] = count;
      return acc;
    }, {} as Record<string, number>);
  },

  async getClicksByHour(linkId: string): Promise<Record<number, number>> {
    const result = await ClickEvent.aggregate([
      { $match: { linkId } },
      { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
    ]);
    return result.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {} as Record<number, number>);
  },

  async getBotClicks(linkId: string): Promise<number> {
    return ClickEvent.countDocuments({ linkId, isBot: true });
  },

  async getSuspiciousClicks(linkId: string): Promise<number> {
    return ClickEvent.countDocuments({ linkId, isSuspicious: true });
  },

  async getClicksForDate(linkIds: string[], date: string): Promise<number> {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return ClickEvent.countDocuments({
      linkId: { $in: linkIds },
      timestamp: { $gte: startOfDay, $lt: endOfDay },
    });
  },

  async deleteByLink(linkId: string): Promise<void> {
    await ClickEvent.deleteMany({ linkId });
  },
};
