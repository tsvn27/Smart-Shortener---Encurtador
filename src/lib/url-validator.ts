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
      return { valid: false, error: 'Apenas URLs HTTP e HTTPS são permitidas' };
    }
    
    const hostname = parsed.hostname.toLowerCase();
    
    if (BLOCKED_DOMAINS.some(domain => hostname.includes(domain))) {
      return { valid: false, error: 'Encurtadores de URL não são permitidos' };
    }
    
    if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return { valid: false, error: 'URLs locais não são permitidas' };
    }
    
    if (BLOCKED_PATTERNS.some(pattern => pattern.test(url))) {
      return { valid: false, error: 'URL contém conteúdo bloqueado' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Formato de URL inválido' };
  }
}

export function sanitizeUrl(url: string): string {
  return url.trim().replace(/[<>"']/g, '');
}
