import type { Link, RedirectContext, RedirectRule, RuleCondition } from '../types/index.js';

export class RedirectEngine {
  
  resolveTarget(link: Link, context: RedirectContext): { url: string; ruleId?: string } {
    if (link.state !== 'active') {
      return { url: this.getStateUrl(link) };
    }
    
    const limitResult = this.checkLimits(link, context);
    if (!limitResult.allowed) {
      return { url: limitResult.fallbackUrl || link.defaultTargetUrl };
    }
    
    const sortedRules = [...link.rules]
      .filter(r => r.active)
      .sort((a, b) => a.priority - b.priority);
    
    for (const rule of sortedRules) {
      if (this.evaluateRule(rule, context)) {
        return { url: rule.targetUrl, ruleId: rule.id };
      }
    }
    
    return { url: link.defaultTargetUrl };
  }
  
  private evaluateRule(rule: RedirectRule, context: RedirectContext): boolean {
    return rule.conditions.every(cond => this.evaluateCondition(cond, context));
  }
  
  private evaluateCondition(cond: RuleCondition, context: RedirectContext): boolean {
    const value = context[cond.field];
    if (value === undefined) return false;
    
    switch (cond.operator) {
      case 'eq': return value === cond.value;
      case 'neq': return value !== cond.value;
      case 'in': return Array.isArray(cond.value) && cond.value.includes(value as string);
      case 'nin': return Array.isArray(cond.value) && !cond.value.includes(value as string);
      case 'gt': return typeof value === 'number' && value > (cond.value as number);
      case 'lt': return typeof value === 'number' && value < (cond.value as number);
      case 'gte': return typeof value === 'number' && value >= (cond.value as number);
      case 'lte': return typeof value === 'number' && value <= (cond.value as number);
      case 'contains': return typeof value === 'string' && value.includes(cond.value as string);
      default: return false;
    }
  }
  
  private checkLimits(link: Link, context: RedirectContext): { allowed: boolean; fallbackUrl?: string } {
    const limits = link.limits;
    const now = new Date();
    
    if (limits.maxClicks && link.totalClicks >= limits.maxClicks) {
      return { allowed: false, fallbackUrl: '/expired' };
    }
    
    if (limits.maxClicksPerDay && link.clicksToday >= limits.maxClicksPerDay) {
      return { allowed: false, fallbackUrl: '/limit-reached' };
    }
    
    if (limits.validFrom && now < limits.validFrom) {
      return { allowed: false, fallbackUrl: '/not-yet-active' };
    }
    
    if (limits.expiresAt && now > limits.expiresAt) {
      return { allowed: false, fallbackUrl: '/expired' };
    }
    
    if (context.country) {
      if (limits.allowedCountries?.length && !limits.allowedCountries.includes(context.country)) {
        return { allowed: false, fallbackUrl: '/geo-blocked' };
      }
      if (limits.blockedCountries?.includes(context.country)) {
        return { allowed: false, fallbackUrl: '/geo-blocked' };
      }
    }
    
    return { allowed: true };
  }
  
  private getStateUrl(link: Link): string {
    switch (link.state) {
      case 'paused': return '/paused';
      case 'expired': return '/expired';
      case 'dead': return '/not-found';
      default: return link.defaultTargetUrl;
    }
  }
}

export const redirectEngine = new RedirectEngine();
