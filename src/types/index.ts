export type LinkState = 'active' | 'paused' | 'expired' | 'dead' | 'viral';
export type LinkHealth = 'healthy' | 'warning' | 'sick' | 'critical';

export interface RedirectContext {
  country?: string;
  language?: string;
  hour?: number;
  dayOfWeek?: number;
  device?: 'mobile' | 'tablet' | 'desktop' | 'bot';
  os?: string;
  browser?: string;
  campaign?: string;
  referrer?: string;
}

export interface RedirectRule {
  id: string;
  priority: number;
  conditions: RuleCondition[];
  targetUrl: string;
  active: boolean;
}

export interface RuleCondition {
  field: keyof RedirectContext;
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: string | number | string[];
}

export interface LinkLimits {
  maxClicks?: number;
  maxClicksPerDay?: number;
  expiresAt?: Date;
  validFrom?: Date;
  allowedCountries?: string[];
  blockedCountries?: string[];
}

export interface LinkScript {
  id: string;
  trigger: 'click' | 'threshold' | 'schedule';
  condition: string;
  action: 'redirect' | 'pause' | 'notify' | 'switch_target';
  actionParams: Record<string, unknown>;
}

export interface Link {
  id: string;
  shortCode: string;
  originalUrl: string;
  defaultTargetUrl: string;
  ownerId: string;
  state: LinkState;
  healthScore: number;
  trustScore: number;
  rules: RedirectRule[];
  scripts: LinkScript[];
  limits: LinkLimits;
  tags: string[];
  campaign?: string;
  abTestId?: string;
  totalClicks: number;
  uniqueClicks: number;
  clicksToday: number;
  lastClickAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClickEvent {
  id: string;
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

export interface ApiKey {
  id: string;
  key: string;
  keyHash: string;
  name: string;
  ownerId: string;
  permissions: ApiPermission[];
  rateLimit: RateLimitConfig;
  lastUsedAt?: Date;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
}

export type ApiPermission = 
  | 'links:read' 
  | 'links:write' 
  | 'links:delete'
  | 'analytics:read'
  | 'webhooks:manage'
  | 'api_keys:manage';

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export interface Webhook {
  id: string;
  ownerId: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  active: boolean;
  maxRetries: number;
  retryDelayMs: number;
  totalDeliveries: number;
  failedDeliveries: number;
  lastDeliveryAt?: Date;
  createdAt: Date;
}

export type WebhookEvent = 
  | 'link.created'
  | 'link.clicked'
  | 'link.expired'
  | 'link.threshold_reached'
  | 'link.state_changed'
  | 'fraud.detected'
  | 'api_key.used';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  maxLinks: number;
  maxApiKeys: number;
  maxWebhooks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  apiKeyId?: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export interface ABTest {
  id: string;
  name: string;
  ownerId: string;
  variants: ABVariant[];
  totalClicks: number;
  winningVariant?: string;
  status: 'running' | 'paused' | 'completed';
  startedAt: Date;
  endedAt?: Date;
}

export interface ABVariant {
  id: string;
  name: string;
  targetUrl: string;
  weight: number;
  clicks: number;
  conversions: number;
}

export interface LinkAnalytics {
  linkId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  timestamp: Date;
  clicks: number;
  uniqueClicks: number;
  byCountry: Record<string, number>;
  byDevice: Record<string, number>;
  byBrowser: Record<string, number>;
  byReferrer: Record<string, number>;
  byHour: Record<number, number>;
  botClicks: number;
  suspiciousClicks: number;
  avgFraudScore: number;
}
