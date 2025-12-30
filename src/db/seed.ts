import { existsSync, mkdirSync } from 'fs';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import { initDb, execute, closeDb } from './index.js';

if (!existsSync('data')) mkdirSync('data');

try {
  initDb();
  
  const userId = nanoid();
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.default.hash('demo123', 12);
  
  execute(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, plan, max_links, max_api_keys, max_webhooks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, 'demo@example.com', passwordHash, 'Demo User', 'pro', 1000, 10, 10]
  );
  
  const apiKey = `sk_live_${nanoid(32)}`;
  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
  
  execute(
    `INSERT OR IGNORE INTO api_keys (id, key_hash, name, owner_id, permissions_json) VALUES (?, ?, ?, ?, ?)`,
    [nanoid(), apiKeyHash, 'Default Key', userId, JSON.stringify(['links:read', 'links:write', 'links:delete', 'analytics:read'])]
  );
  
  console.log(`API Key: ${apiKey}`);
  
  const links = [
    { shortCode: 'demo1', url: 'https://example.com', rules: [{ id: nanoid(), priority: 1, conditions: [{ field: 'country', operator: 'eq', value: 'BR' }], targetUrl: 'https://example.com/br', active: true }] },
    { shortCode: 'demo2', url: 'https://github.com', limits: { maxClicks: 1000 } },
    { shortCode: 'promo', url: 'https://example.com/promo', scripts: [{ id: nanoid(), trigger: 'threshold', condition: 'clicks_today > 500', action: 'redirect', actionParams: { url: 'https://example.com/promo-ended' } }] },
  ];
  
  for (const link of links) {
    execute(
      `INSERT OR IGNORE INTO links (id, short_code, original_url, default_target_url, owner_id, rules_json, scripts_json, limits_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nanoid(), link.shortCode, link.url, link.url, userId, JSON.stringify(link.rules || []), JSON.stringify(link.scripts || []), JSON.stringify(link.limits || {})]
    );
  }
  
  console.log('Seed complete');
  
} catch (error) {
  console.error('Seed failed:', error);
  process.exit(1);
} finally {
  closeDb();
}
