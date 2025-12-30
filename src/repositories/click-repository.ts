import { nanoid } from 'nanoid';
import { queryOne, queryAll, execute } from '../db/index.js';
import type { ClickEvent } from '../types/index.js';

interface ClickRow {
  id: string;
  link_id: string;
  timestamp: string;
  ip: string;
  ip_hash: string;
  user_agent: string | null;
  fingerprint: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  language: string | null;
  referrer: string | null;
  is_bot: number;
  is_suspicious: number;
  fraud_score: number;
  fraud_reasons_json: string;
  redirected_to: string;
  rule_applied: string | null;
  response_time_ms: number | null;
}

function rowToClick(row: ClickRow): ClickEvent {
  return {
    id: row.id,
    linkId: row.link_id,
    timestamp: new Date(row.timestamp),
    ip: row.ip,
    ipHash: row.ip_hash,
    userAgent: row.user_agent || '',
    fingerprint: row.fingerprint || '',
    country: row.country || undefined,
    city: row.city || undefined,
    device: row.device || 'unknown',
    os: row.os || 'unknown',
    browser: row.browser || 'unknown',
    language: row.language || undefined,
    referrer: row.referrer || undefined,
    isBot: row.is_bot === 1,
    isSuspicious: row.is_suspicious === 1,
    fraudScore: row.fraud_score,
    fraudReasons: JSON.parse(row.fraud_reasons_json),
    redirectedTo: row.redirected_to,
    ruleApplied: row.rule_applied || undefined,
    responseTimeMs: row.response_time_ms || 0,
  };
}

export const clickRepository = {
  create(data: Omit<ClickEvent, 'id' | 'timestamp'>): ClickEvent {
    const id = nanoid();
    
    execute(
      `INSERT INTO click_events (
        id, link_id, ip, ip_hash, user_agent, fingerprint,
        country, city, device, os, browser, language, referrer,
        is_bot, is_suspicious, fraud_score, fraud_reasons_json,
        redirected_to, rule_applied, response_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.linkId,
        data.ip,
        data.ipHash,
        data.userAgent,
        data.fingerprint,
        data.country || null,
        data.city || null,
        data.device,
        data.os,
        data.browser,
        data.language || null,
        data.referrer || null,
        data.isBot ? 1 : 0,
        data.isSuspicious ? 1 : 0,
        data.fraudScore,
        JSON.stringify(data.fraudReasons),
        data.redirectedTo,
        data.ruleApplied || null,
        data.responseTimeMs,
      ]
    );
    
    const row = queryOne<ClickRow>('SELECT * FROM click_events WHERE id = ?', [id]);
    return rowToClick(row!);
  },

  findByLink(linkId: string, limit = 100, offset = 0): ClickEvent[] {
    const rows = queryAll<ClickRow>(
      `SELECT * FROM click_events WHERE link_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [linkId, limit, offset]
    );
    return rows.map(rowToClick);
  },

  countByLink(linkId: string): number {
    const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM click_events WHERE link_id = ?', [linkId]);
    return result?.count || 0;
  },

  countUniqueByLink(linkId: string): number {
    const result = queryOne<{ count: number }>('SELECT COUNT(DISTINCT ip_hash) as count FROM click_events WHERE link_id = ?', [linkId]);
    return result?.count || 0;
  },

  hasClickedBefore(linkId: string, ipHash: string): boolean {
    const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM click_events WHERE link_id = ? AND ip_hash = ?', [linkId, ipHash]);
    return (result?.count || 0) > 0;
  },

  getClicksByCountry(linkId: string): Record<string, number> {
    const rows = queryAll<{ country: string; count: number }>(
      `SELECT country, COUNT(*) as count FROM click_events WHERE link_id = ? AND country IS NOT NULL GROUP BY country ORDER BY count DESC`,
      [linkId]
    );
    return Object.fromEntries(rows.map(r => [r.country, r.count]));
  },

  getClicksByDevice(linkId: string): Record<string, number> {
    const rows = queryAll<{ device: string; count: number }>(
      `SELECT device, COUNT(*) as count FROM click_events WHERE link_id = ? GROUP BY device ORDER BY count DESC`,
      [linkId]
    );
    return Object.fromEntries(rows.map(r => [r.device, r.count]));
  },

  getClicksByHour(linkId: string): Record<number, number> {
    const rows = queryAll<{ hour: number; count: number }>(
      `SELECT strftime('%H', timestamp) as hour, COUNT(*) as count FROM click_events WHERE link_id = ? GROUP BY hour ORDER BY hour`,
      [linkId]
    );
    return Object.fromEntries(rows.map(r => [parseInt(r.hour.toString()), r.count]));
  },

  getRecentClicks(linkId: string, minutes: number): number {
    const result = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM click_events WHERE link_id = ? AND timestamp > datetime('now', '-' || ? || ' minutes')`,
      [linkId, minutes]
    );
    return result?.count || 0;
  },

  getBotClicks(linkId: string): number {
    const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM click_events WHERE link_id = ? AND is_bot = 1', [linkId]);
    return result?.count || 0;
  },

  getSuspiciousClicks(linkId: string): number {
    const result = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM click_events WHERE link_id = ? AND is_suspicious = 1', [linkId]);
    return result?.count || 0;
  },
};
