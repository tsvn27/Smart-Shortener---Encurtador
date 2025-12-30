import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  minute: Map<string, RateLimitEntry>;
  hour: Map<string, RateLimitEntry>;
  day: Map<string, RateLimitEntry>;
}

const store: RateLimitStore = {
  minute: new Map(),
  hour: new Map(),
  day: new Map(),
};

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.minute) {
    if (entry.resetAt < now) store.minute.delete(key);
  }
  for (const [key, entry] of store.hour) {
    if (entry.resetAt < now) store.hour.delete(key);
  }
  for (const [key, entry] of store.day) {
    if (entry.resetAt < now) store.day.delete(key);
  }
}, 60000);

interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

const DEFAULT_LIMITS: RateLimitConfig = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
};

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const identifier = req.apiKey?.id || req.ip || 'unknown';
  const limits = req.apiKey?.rateLimit || DEFAULT_LIMITS;
  const now = Date.now();
  
  const minuteKey = `${identifier}:minute`;
  const minuteEntry = store.minute.get(minuteKey) || { count: 0, resetAt: now + 60000 };
  
  if (minuteEntry.resetAt < now) {
    minuteEntry.count = 0;
    minuteEntry.resetAt = now + 60000;
  }
  
  if (minuteEntry.count >= limits.requestsPerMinute) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      limit: 'minute',
      retryAfter: Math.ceil((minuteEntry.resetAt - now) / 1000),
    });
  }
  
  const hourKey = `${identifier}:hour`;
  const hourEntry = store.hour.get(hourKey) || { count: 0, resetAt: now + 3600000 };
  
  if (hourEntry.resetAt < now) {
    hourEntry.count = 0;
    hourEntry.resetAt = now + 3600000;
  }
  
  if (hourEntry.count >= limits.requestsPerHour) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      limit: 'hour',
      retryAfter: Math.ceil((hourEntry.resetAt - now) / 1000),
    });
  }
  
  const dayKey = `${identifier}:day`;
  const dayEntry = store.day.get(dayKey) || { count: 0, resetAt: now + 86400000 };
  
  if (dayEntry.resetAt < now) {
    dayEntry.count = 0;
    dayEntry.resetAt = now + 86400000;
  }
  
  if (dayEntry.count >= limits.requestsPerDay) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      limit: 'day',
      retryAfter: Math.ceil((dayEntry.resetAt - now) / 1000),
    });
  }
  
  minuteEntry.count++;
  hourEntry.count++;
  dayEntry.count++;
  
  store.minute.set(minuteKey, minuteEntry);
  store.hour.set(hourKey, hourEntry);
  store.day.set(dayKey, dayEntry);
  
  res.setHeader('X-RateLimit-Limit-Minute', limits.requestsPerMinute);
  res.setHeader('X-RateLimit-Remaining-Minute', limits.requestsPerMinute - minuteEntry.count);
  res.setHeader('X-RateLimit-Reset-Minute', Math.ceil(minuteEntry.resetAt / 1000));
  
  next();
}
