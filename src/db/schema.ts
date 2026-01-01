export const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  plan TEXT DEFAULT 'free',
  max_links INTEGER DEFAULT 100,
  max_api_keys INTEGER DEFAULT 5,
  max_webhooks INTEGER DEFAULT 3,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  default_target_url TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  state TEXT DEFAULT 'active',
  health_score INTEGER DEFAULT 100,
  trust_score INTEGER DEFAULT 100,
  rules_json TEXT DEFAULT '[]',
  scripts_json TEXT DEFAULT '[]',
  limits_json TEXT DEFAULT '{}',
  tags_json TEXT DEFAULT '[]',
  campaign TEXT,
  ab_test_id TEXT,
  total_clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  clicks_today INTEGER DEFAULT 0,
  last_click_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_links_owner ON links(owner_id);
CREATE INDEX IF NOT EXISTS idx_links_state ON links(state);

CREATE TABLE IF NOT EXISTS click_events (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL REFERENCES links(id),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  fingerprint TEXT,
  country TEXT,
  city TEXT,
  device TEXT,
  os TEXT,
  browser TEXT,
  language TEXT,
  referrer TEXT,
  is_bot INTEGER DEFAULT 0,
  is_suspicious INTEGER DEFAULT 0,
  fraud_score INTEGER DEFAULT 0,
  fraud_reasons_json TEXT DEFAULT '[]',
  redirected_to TEXT NOT NULL,
  rule_applied TEXT,
  response_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_clicks_link ON click_events(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON click_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_clicks_ip_hash ON click_events(ip_hash);
`;

export const schemaExtended = `
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  permissions_json TEXT DEFAULT '["links:read"]',
  rate_limit_json TEXT DEFAULT '{"requestsPerMinute":60,"requestsPerHour":1000,"requestsPerDay":10000}',
  last_used_at DATETIME,
  expires_at DATETIME,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_id);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events_json TEXT DEFAULT '[]',
  active INTEGER DEFAULT 1,
  max_retries INTEGER DEFAULT 3,
  retry_delay_ms INTEGER DEFAULT 1000,
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhooks_owner ON webhooks(owner_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  api_key_id TEXT REFERENCES api_keys(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details_json TEXT DEFAULT '{}',
  ip TEXT,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

CREATE TABLE IF NOT EXISTS ab_tests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  variants_json TEXT DEFAULT '[]',
  total_clicks INTEGER DEFAULT 0,
  winning_variant TEXT,
  status TEXT DEFAULT 'running',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME
);

CREATE TABLE IF NOT EXISTS analytics_rollups (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL REFERENCES links(id),
  period TEXT NOT NULL,
  period_start DATETIME NOT NULL,
  clicks INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  by_country_json TEXT DEFAULT '{}',
  by_device_json TEXT DEFAULT '{}',
  by_browser_json TEXT DEFAULT '{}',
  by_referrer_json TEXT DEFAULT '{}',
  by_hour_json TEXT DEFAULT '{}',
  bot_clicks INTEGER DEFAULT 0,
  suspicious_clicks INTEGER DEFAULT 0,
  avg_fraud_score REAL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_rollups_link ON analytics_rollups(link_id);
CREATE INDEX IF NOT EXISTS idx_rollups_period ON analytics_rollups(period, period_start);

CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
`;
