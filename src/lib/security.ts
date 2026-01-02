import { Request, Response, NextFunction } from 'express';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { logger } from './logger.js';

const BLOCKED_IPS = new Map<string, { until: number; reason: string }>();
const SUSPICIOUS_ACTIVITY = new Map<string, { count: number; lastSeen: number }>();
const REQUEST_FINGERPRINTS = new Map<string, { count: number; lastSeen: number }>();
const FAILED_LOGINS = new Map<string, { count: number; lastAttempt: number }>();
const HONEYPOT_TRIGGERS = new Map<string, number>();

const BLOCKED_USER_AGENTS = [
  /curl/i, /wget/i, /python-requests/i, /httpie/i,
  /scrapy/i, /phantomjs/i, /headless/i, /selenium/i,
  /puppeteer/i, /playwright/i, /nightmare/i, /zombie/i,
  /htmlunit/i, /mechanize/i, /httpclient/i, /winhttp/i,
  /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /zap/i,
  /burp/i, /acunetix/i, /nessus/i, /openvas/i, /w3af/i,
  /havij/i, /sqlninja/i, /pangolin/i, /webscarab/i,
  /paros/i, /grabber/i, /dirbuster/i, /gobuster/i,
  /wfuzz/i, /ffuf/i, /feroxbuster/i, /nuclei/i,
];

const BLOCKED_PATTERNS = [
  /\.\.\//g, /<script/gi, /javascript:/gi, /on\w+=/gi,
  /union\s+select/gi, /insert\s+into/gi, /drop\s+table/gi,
  /delete\s+from/gi, /update\s+.*set/gi, /exec\s*\(/gi,
  /eval\s*\(/gi, /expression\s*\(/gi, /vbscript:/gi,
  /&#/g, /%3c/gi, /%3e/gi,
  /\x00/g, /\x1a/g, /\x0d/g, /\x0a/g,
];

const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
  /exec(\s|\+)+(s|x)p\w+/i,
  /UNION(\s+)ALL(\s+)SELECT/i,
  /UNION(\s+)SELECT/i,
  /INTO(\s+)OUTFILE/i,
  /INTO(\s+)DUMPFILE/i,
];

const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<[^>]+on\w+\s*=/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /expression\s*\([^)]*\)/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
];

export function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }
  return req.headers['x-real-ip'] as string || req.socket.remoteAddress || 'unknown';
}

export function generateFingerprint(req: Request): string {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['accept'] || '',
    getClientIP(req),
  ];
  return createHash('sha256').update(components.join('|')).digest('hex').slice(0, 16);
}

export function blockIP(ip: string, durationMs: number, reason: string) {
  BLOCKED_IPS.set(ip, { until: Date.now() + durationMs, reason });
  logger.warn(`IP blocked: ${ip} for ${durationMs}ms - ${reason}`);
}

export function isIPBlocked(ip: string): boolean {
  const block = BLOCKED_IPS.get(ip);
  if (!block) return false;
  if (Date.now() > block.until) {
    BLOCKED_IPS.delete(ip);
    return false;
  }
  return true;
}

export function recordSuspiciousActivity(ip: string) {
  const now = Date.now();
  const record = SUSPICIOUS_ACTIVITY.get(ip) || { count: 0, lastSeen: now };
  
  if (now - record.lastSeen > 3600000) {
    record.count = 1;
  } else {
    record.count++;
  }
  record.lastSeen = now;
  SUSPICIOUS_ACTIVITY.set(ip, record);
  
  if (record.count >= 10) {
    blockIP(ip, 3600000, 'Too many suspicious activities');
  } else if (record.count >= 5) {
    blockIP(ip, 900000, 'Multiple suspicious activities');
  }
}

export function checkRequestFingerprint(fingerprint: string): boolean {
  const now = Date.now();
  const record = REQUEST_FINGERPRINTS.get(fingerprint) || { count: 0, lastSeen: now };
  
  if (now - record.lastSeen > 60000) {
    record.count = 1;
  } else {
    record.count++;
  }
  record.lastSeen = now;
  REQUEST_FINGERPRINTS.set(fingerprint, record);
  
  return record.count <= 100;
}

export function detectBot(req: Request): { isBot: boolean; reason?: string } {
  const ua = req.headers['user-agent'] || '';
  
  if (!ua || ua.length < 10) {
    return { isBot: true, reason: 'Missing or short user-agent' };
  }
  
  for (const pattern of BLOCKED_USER_AGENTS) {
    if (pattern.test(ua)) {
      return { isBot: true, reason: `Blocked user-agent: ${pattern}` };
    }
  }
  
  if (!req.headers['accept-language']) {
    return { isBot: true, reason: 'Missing accept-language header' };
  }
  
  if (!req.headers['accept']) {
    return { isBot: true, reason: 'Missing accept header' };
  }
  
  const suspiciousHeaders = ['x-scanner', 'x-probe', 'x-test'];
  for (const header of suspiciousHeaders) {
    if (req.headers[header]) {
      return { isBot: true, reason: `Suspicious header: ${header}` };
    }
  }
  
  return { isBot: false };
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  let sanitized = input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim();
  
  if (sanitized.length > 10000) {
    sanitized = sanitized.slice(0, 10000);
  }
  
  return sanitized;
}

export function validateInput(input: string): { valid: boolean; reason?: string } {
  if (typeof input !== 'string') {
    return { valid: false, reason: 'Input must be a string' };
  }
  
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { valid: false, reason: 'Potential SQL injection detected' };
    }
  }
  
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      return { valid: false, reason: 'Potential XSS detected' };
    }
  }
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input)) {
      return { valid: false, reason: 'Blocked pattern detected' };
    }
  }
  
  return { valid: true };
}

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

export function verifyCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  try {
    const tokenBuffer = Buffer.from(token);
    const storedBuffer = Buffer.from(storedToken);
    if (tokenBuffer.length !== storedBuffer.length) return false;
    return timingSafeEqual(tokenBuffer, storedBuffer);
  } catch {
    return false;
  }
}

export function recordFailedLogin(ip: string): boolean {
  const now = Date.now();
  const record = FAILED_LOGINS.get(ip) || { count: 0, lastAttempt: now };
  
  if (now - record.lastAttempt > 900000) {
    record.count = 1;
  } else {
    record.count++;
  }
  record.lastAttempt = now;
  FAILED_LOGINS.set(ip, record);
  
  if (record.count >= 5) {
    blockIP(ip, 1800000, 'Too many failed login attempts'); // 30 min
    return true;
  }
  return false;
}

export function clearFailedLogins(ip: string) {
  FAILED_LOGINS.delete(ip);
}

export function checkHoneypot(ip: string, honeypotValue: string): boolean {
  if (honeypotValue && honeypotValue.length > 0) {
    const triggers = (HONEYPOT_TRIGGERS.get(ip) || 0) + 1;
    HONEYPOT_TRIGGERS.set(ip, triggers);
    
    if (triggers >= 2) {
      blockIP(ip, 86400000, 'Honeypot triggered multiple times'); // 24h
    }
    
    logger.warn(`Honeypot triggered from ${ip}`);
    return true;
  }
  return false;
}

export function detectPathTraversal(path: string): boolean {
  const patterns = [
    /\.\.\//g,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
    /\.\.\\/g,
    /%2e%2e%2f/gi,
    /%2e%2e\//gi,
    /\.%2e\//gi,
    /%2e\.\//gi,
  ];
  return patterns.some(p => p.test(path));
}

export function detectCommandInjection(input: string): boolean {
  const patterns = [
    /[;&|`$]/,
    /\$\(/,
    /`.*`/,
    /\|\|/,
    /&&/,
    /\n/,
    /\r/,
    /;.*rm\s/i,
    /;.*cat\s/i,
    /;.*wget\s/i,
    /;.*curl\s/i,
  ];
  return patterns.some(p => p.test(input));
}

export function detectProxy(req: Request): boolean {
  const proxyHeaders = [
    'via',
    'x-forwarded-for',
    'forwarded',
    'x-proxy-id',
    'proxy-connection',
  ];
  
  let proxyScore = 0;
  for (const header of proxyHeaders) {
    if (req.headers[header]) proxyScore++;
  }
  
  return proxyScore >= 3;
}

export const securityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIP(req);
  
  if (isIPBlocked(ip)) {
    logger.warn(`Blocked request from ${ip}`);
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  if (detectPathTraversal(req.path)) {
    blockIP(ip, 3600000, 'Path traversal attempt');
    logger.warn(`Path traversal attempt from ${ip}: ${req.path}`);
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  const fingerprint = generateFingerprint(req);
  if (!checkRequestFingerprint(fingerprint)) {
    blockIP(ip, 300000, 'Rate limit exceeded by fingerprint');
    return res.status(429).json({ error: 'Muitas requisições' });
  }
  
  const publicPaths = ['/api/v1/stats/public', '/health', '/api/docs', '/:code'];
  const isPublicPath = publicPaths.some(p => req.path.startsWith(p.replace(':code', '')));
  
  if (!isPublicPath) {
    const botCheck = detectBot(req);
    if (botCheck.isBot) {
      recordSuspiciousActivity(ip);
      logger.warn(`Bot detected from ${ip}: ${botCheck.reason}`);
      return res.status(403).json({ error: 'Acesso negado' });
    }
  }
  
  if (req.body?.website || req.body?.url_confirm || req.body?.phone_number) {
    if (checkHoneypot(ip, req.body.website || req.body.url_confirm || req.body.phone_number)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
  }
  
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string' && key !== 'avatar' && value.length < 10000) {
        const validation = validateInput(value);
        if (!validation.valid) {
          recordSuspiciousActivity(ip);
          logger.warn(`Invalid input from ${ip}: ${validation.reason}`);
          return res.status(400).json({ error: 'Entrada inválida' });
        }
        
        if (detectCommandInjection(value)) {
          blockIP(ip, 3600000, 'Command injection attempt');
          logger.warn(`Command injection attempt from ${ip}`);
          return res.status(400).json({ error: 'Entrada inválida' });
        }
      }
    }
  }
  
  const url = req.originalUrl || req.url;
  const urlValidation = validateInput(url);
  if (!urlValidation.valid) {
    recordSuspiciousActivity(ip);
    return res.status(400).json({ error: 'Requisição inválida' });
  }
  
  res.setHeader('X-Request-ID', randomBytes(8).toString('hex'));
  
  next();
};

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.removeHeader('X-Powered-By');
  next();
};

setInterval(() => {
  const now = Date.now();
  
  for (const [ip, block] of BLOCKED_IPS.entries()) {
    if (now > block.until) BLOCKED_IPS.delete(ip);
  }
  
  for (const [ip, record] of SUSPICIOUS_ACTIVITY.entries()) {
    if (now - record.lastSeen > 3600000) SUSPICIOUS_ACTIVITY.delete(ip);
  }
  
  for (const [fp, record] of REQUEST_FINGERPRINTS.entries()) {
    if (now - record.lastSeen > 300000) REQUEST_FINGERPRINTS.delete(fp);
  }
}, 60000);
