import { createHash } from 'crypto';
import type { RedirectContext } from '../types/index.js';

interface FraudAnalysis {
  isBot: boolean;
  isSuspicious: boolean;
  fraudScore: number;
  reasons: string[];
  fingerprint: string;
}

interface RequestData {
  ip: string;
  userAgent: string;
  headers: Record<string, string | undefined>;
  context: RedirectContext;
}

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i,
  /curl/i, /wget/i, /python/i, /java\//i,
  /headless/i, /phantom/i, /selenium/i,
  /googlebot/i, /bingbot/i, /yandex/i,
  /facebookexternalhit/i, /twitterbot/i,
];

const SUSPICIOUS_PATTERNS = [/^$/, /^-$/, /test/i];

export class FraudDetector {
  private clickHistory: Map<string, number[]> = new Map();
  private ipClickCounts: Map<string, number> = new Map();
  
  analyze(data: RequestData): FraudAnalysis {
    const reasons: string[] = [];
    let score = 0;
    
    const fingerprint = this.generateFingerprint(data);
    const ua = data.userAgent || '';
    
    const isKnownBot = BOT_PATTERNS.some(p => p.test(ua));
    if (isKnownBot) {
      reasons.push('known_bot_ua');
      score += 80;
    }
    
    if (SUSPICIOUS_PATTERNS.some(p => p.test(ua))) {
      reasons.push('suspicious_ua');
      score += 30;
    }
    
    if (!data.headers['accept-language']) {
      reasons.push('no_accept_language');
      score += 15;
    }
    
    if (!data.headers['accept']) {
      reasons.push('no_accept_header');
      score += 10;
    }
    
    const velocityScore = this.checkClickVelocity(fingerprint);
    if (velocityScore > 0) {
      reasons.push('high_click_velocity');
      score += velocityScore;
    }
    
    const ipScore = this.checkIpReputation(data.ip);
    if (ipScore > 0) {
      reasons.push('suspicious_ip_activity');
      score += ipScore;
    }
    
    if (this.looksLikeDatacenter(data.ip)) {
      reasons.push('datacenter_ip');
      score += 20;
    }
    
    score = Math.min(score, 100);
    
    return {
      isBot: isKnownBot || score >= 80,
      isSuspicious: score >= 40,
      fraudScore: score,
      reasons,
      fingerprint,
    };
  }
  
  private generateFingerprint(data: RequestData): string {
    const components = [
      data.ip,
      data.userAgent,
      data.headers['accept-language'] || '',
      data.headers['accept-encoding'] || '',
      data.context.device || '',
      data.context.os || '',
    ];
    
    return createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 16);
  }
  
  private checkClickVelocity(fingerprint: string): number {
    const now = Date.now();
    const history = this.clickHistory.get(fingerprint) || [];
    
    history.push(now);
    
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const recentClicks = history.filter(t => t > fiveMinutesAgo);
    this.clickHistory.set(fingerprint, recentClicks);
    
    if (recentClicks.length > 50) return 50;
    if (recentClicks.length > 20) return 30;
    if (recentClicks.length > 10) return 15;
    
    const lastTwo = recentClicks.slice(-2);
    if (lastTwo.length === 2 && lastTwo[1] - lastTwo[0] < 1000) {
      return 25;
    }
    
    return 0;
  }
  
  private checkIpReputation(ip: string): number {
    const count = this.ipClickCounts.get(ip) || 0;
    this.ipClickCounts.set(ip, count + 1);
    
    if (count > 100) return 40;
    if (count > 50) return 20;
    if (count > 20) return 10;
    
    return 0;
  }
  
  private looksLikeDatacenter(ip: string): boolean {
    const datacenterPrefixes = ['34.', '35.', '52.', '54.', '104.', '108.', '157.', '159.'];
    return datacenterPrefixes.some(prefix => ip.startsWith(prefix));
  }
  
  cleanup(): void {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    for (const [fp, times] of this.clickHistory.entries()) {
      const recent = times.filter(t => t > fiveMinutesAgo);
      if (recent.length === 0) {
        this.clickHistory.delete(fp);
      } else {
        this.clickHistory.set(fp, recent);
      }
    }
    
    this.ipClickCounts.clear();
  }
}

export const fraudDetector = new FraudDetector();

setInterval(() => fraudDetector.cleanup(), 5 * 60 * 1000);
