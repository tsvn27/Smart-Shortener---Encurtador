const BLOCKED_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  't.co',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'adf.ly',
  'j.mp',
];

const BLOCKED_PATTERNS = [
  /phishing/i,
  /malware/i,
  /virus/i,
  /hack/i,
];

export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    
    const hostname = parsed.hostname.toLowerCase();
    
    if (BLOCKED_DOMAINS.some(domain => hostname.includes(domain))) {
      return { valid: false, error: 'URL shorteners are not allowed' };
    }
    
    if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return { valid: false, error: 'Local URLs are not allowed' };
    }
    
    if (BLOCKED_PATTERNS.some(pattern => pattern.test(url))) {
      return { valid: false, error: 'URL contains blocked content' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function sanitizeUrl(url: string): string {
  return url.trim().replace(/[<>"']/g, '');
}
