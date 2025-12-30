import { nanoid } from 'nanoid';
import { queryOne, queryAll, execute } from '../db/index.js';
import type { Link, RedirectRule, LinkScript, LinkLimits } from '../types/index.js';

interface LinkRow {
  id: string;
  short_code: string;
  original_url: string;
  default_target_url: string;
  owner_id: string;
  state: string;
  health_score: number;
  trust_score: number;
  rules_json: string;
  scripts_json: string;
  limits_json: string;
  tags_json: string;
  campaign: string | null;
  ab_test_id: string | null;
  total_clicks: number;
  unique_clicks: number;
  clicks_today: number;
  last_click_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToLink(row: LinkRow): Link {
  return {
    id: row.id,
    shortCode: row.short_code,
    originalUrl: row.original_url,
    defaultTargetUrl: row.default_target_url,
    ownerId: row.owner_id,
    state: row.state as Link['state'],
    healthScore: row.health_score,
    trustScore: row.trust_score,
    rules: JSON.parse(row.rules_json) as RedirectRule[],
    scripts: JSON.parse(row.scripts_json) as LinkScript[],
    limits: JSON.parse(row.limits_json) as LinkLimits,
    tags: JSON.parse(row.tags_json) as string[],
    campaign: row.campaign || undefined,
    abTestId: row.ab_test_id || undefined,
    totalClicks: row.total_clicks,
    uniqueClicks: row.unique_clicks,
    clicksToday: row.clicks_today,
    lastClickAt: row.last_click_at ? new Date(row.last_click_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const linkRepository = {
  findByShortCode(shortCode: string): Link | undefined {
    const row = queryOne<LinkRow>('SELECT * FROM links WHERE short_code = ?', [shortCode]);
    return row ? rowToLink(row) : undefined;
  },

  findById(id: string): Link | undefined {
    const row = queryOne<LinkRow>('SELECT * FROM links WHERE id = ?', [id]);
    return row ? rowToLink(row) : undefined;
  },

  findByOwner(ownerId: string, limit = 100, offset = 0): Link[] {
    const rows = queryAll<LinkRow>(
      'SELECT * FROM links WHERE owner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [ownerId, limit, offset]
    );
    return rows.map(rowToLink);
  },

  create(data: {
    originalUrl: string;
    defaultTargetUrl?: string;
    ownerId: string;
    customCode?: string;
    rules?: RedirectRule[];
    scripts?: LinkScript[];
    limits?: LinkLimits;
    tags?: string[];
    campaign?: string;
  }): Link {
    const id = nanoid();
    const shortCode = data.customCode || nanoid(8);
    
    execute(
      `INSERT INTO links (
        id, short_code, original_url, default_target_url, owner_id,
        rules_json, scripts_json, limits_json, tags_json, campaign
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        shortCode,
        data.originalUrl,
        data.defaultTargetUrl || data.originalUrl,
        data.ownerId,
        JSON.stringify(data.rules || []),
        JSON.stringify(data.scripts || []),
        JSON.stringify(data.limits || {}),
        JSON.stringify(data.tags || []),
        data.campaign || null,
      ]
    );
    
    return this.findById(id)!;
  },

  update(id: string, data: Partial<{
    defaultTargetUrl: string;
    state: Link['state'];
    rules: RedirectRule[];
    scripts: LinkScript[];
    limits: LinkLimits;
    tags: string[];
    campaign: string;
  }>): Link | undefined {
    const updates: string[] = [];
    const values: unknown[] = [];
    
    if (data.defaultTargetUrl !== undefined) {
      updates.push('default_target_url = ?');
      values.push(data.defaultTargetUrl);
    }
    if (data.state !== undefined) {
      updates.push('state = ?');
      values.push(data.state);
    }
    if (data.rules !== undefined) {
      updates.push('rules_json = ?');
      values.push(JSON.stringify(data.rules));
    }
    if (data.scripts !== undefined) {
      updates.push('scripts_json = ?');
      values.push(JSON.stringify(data.scripts));
    }
    if (data.limits !== undefined) {
      updates.push('limits_json = ?');
      values.push(JSON.stringify(data.limits));
    }
    if (data.tags !== undefined) {
      updates.push('tags_json = ?');
      values.push(JSON.stringify(data.tags));
    }
    if (data.campaign !== undefined) {
      updates.push('campaign = ?');
      values.push(data.campaign);
    }
    
    if (updates.length === 0) return this.findById(id);
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    execute(`UPDATE links SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  incrementClicks(id: string): void {
    execute(
      `UPDATE links SET 
        total_clicks = total_clicks + 1,
        clicks_today = clicks_today + 1,
        last_click_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [id]
    );
  },

  incrementUniqueClicks(id: string): void {
    execute('UPDATE links SET unique_clicks = unique_clicks + 1 WHERE id = ?', [id]);
  },

  resetDailyClicks(): void {
    execute('UPDATE links SET clicks_today = 0');
  },

  delete(id: string): boolean {
    const result = execute('DELETE FROM links WHERE id = ?', [id]);
    return result.changes > 0;
  },
};
