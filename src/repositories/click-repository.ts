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

  async getGlobalClicksByCountry(linkIds: string[]): Promise<{ code: string; country: string; count: number }[]> {
    if (linkIds.length === 0) return [];
    
    const countryNames: Record<string, string> = {
      BR: 'Brasil', US: 'Estados Unidos', PT: 'Portugal', ES: 'Espanha', AR: 'Argentina',
      MX: 'México', CO: 'Colômbia', CL: 'Chile', PE: 'Peru', VE: 'Venezuela',
      DE: 'Alemanha', FR: 'França', IT: 'Itália', GB: 'Reino Unido', CA: 'Canadá',
      JP: 'Japão', CN: 'China', IN: 'Índia', AU: 'Austrália', RU: 'Rússia',
    };
    
    const result = await ClickEvent.aggregate([
      { $match: { linkId: { $in: linkIds }, country: { $ne: null } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    
    return result.map(({ _id, count }) => ({
      code: _id,
      country: countryNames[_id] || _id,
      count,
    }));
  },

  async getGlobalClicksByDevice(linkIds: string[]): Promise<{ device: string; count: number }[]> {
    if (linkIds.length === 0) return [];
    
    const result = await ClickEvent.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    
    return result.map(({ _id, count }) => ({
      device: _id || 'Desconhecido',
      count,
    }));
  },

  async getGlobalClicksByBrowser(linkIds: string[]): Promise<{ browser: string; count: number }[]> {
    if (linkIds.length === 0) return [];
    
    const result = await ClickEvent.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    
    return result.map(({ _id, count }) => ({
      browser: _id || 'Desconhecido',
      count,
    }));
  },

  async getGlobalClicksByHour(linkIds: string[]): Promise<{ hour: number; count: number }[]> {
    if (linkIds.length === 0) return [];
    
    const result = await ClickEvent.aggregate([
      { $match: { linkId: { $in: linkIds } } },
      { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    
    return result.map(({ _id, count }) => ({
      hour: _id,
      count,
    }));
  },

  async getGlobalSuspiciousClicks(linkIds: string[]): Promise<number> {
    if (linkIds.length === 0) return 0;
    return ClickEvent.countDocuments({ linkId: { $in: linkIds }, isSuspicious: true });
  },
};
