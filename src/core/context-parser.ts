import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';
import type { RedirectContext } from '../types/index.js';
import type { Request } from 'express';

export function parseContext(req: Request): RedirectContext {
  const ua = new UAParser(req.headers['user-agent']);
  const ip = getClientIp(req);
  const geo = geoip.lookup(ip);
  const now = new Date();
  
  let device: RedirectContext['device'] = 'desktop';
  const deviceType = ua.getDevice().type;
  if (deviceType === 'mobile') device = 'mobile';
  else if (deviceType === 'tablet') device = 'tablet';
  
  const browser = ua.getBrowser().name;
  if (!browser || browser.toLowerCase().includes('bot')) {
    device = 'bot';
  }
  
  return {
    country: geo?.country,
    language: parseLanguage(req.headers['accept-language']),
    hour: now.getHours(),
    dayOfWeek: now.getDay(),
    device,
    os: ua.getOS().name,
    browser: ua.getBrowser().name,
    campaign: (req.query.utm_campaign as string) || (req.query.campaign as string),
    referrer: req.headers.referer || req.headers.referrer,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '0.0.0.0';
}

function parseLanguage(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = header.match(/^([a-z]{2})/i);
  return match ? match[1].toLowerCase() : undefined;
}

export function getHeaders(req: Request): Record<string, string | undefined> {
  const headers: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    headers[key] = Array.isArray(value) ? value[0] : value;
  }
  return headers;
}
