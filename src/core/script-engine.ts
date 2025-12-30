import type { Link, LinkScript } from '../types/index.js';

interface ScriptContext {
  link: Link;
  clicksToday: number;
  clicksThisHour: number;
  totalClicks: number;
  hourOfDay: number;
  dayOfWeek: number;
}

interface ScriptResult {
  triggered: boolean;
  action?: LinkScript['action'];
  params?: Record<string, unknown>;
}

export class ScriptEngine {
  
  evaluate(link: Link, context: Partial<ScriptContext> = {}): ScriptResult[] {
    const fullContext: ScriptContext = {
      link,
      clicksToday: link.clicksToday,
      clicksThisHour: 0,
      totalClicks: link.totalClicks,
      hourOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      ...context,
    };
    
    const results: ScriptResult[] = [];
    
    for (const script of link.scripts) {
      const result = this.evaluateScript(script, fullContext);
      if (result.triggered) {
        results.push(result);
      }
    }
    
    return results;
  }
  
  private evaluateScript(script: LinkScript, ctx: ScriptContext): ScriptResult {
    const conditionMet = this.evaluateCondition(script.condition, ctx);
    
    if (!conditionMet) {
      return { triggered: false };
    }
    
    return {
      triggered: true,
      action: script.action,
      params: script.actionParams,
    };
  }
  
  private evaluateCondition(condition: string, ctx: ScriptContext): boolean {
    const patterns = [
      { regex: /clicks_today\s*(>|<|>=|<=|==|!=)\s*(\d+)/, value: ctx.clicksToday },
      { regex: /clicks_hour\s*(>|<|>=|<=|==|!=)\s*(\d+)/, value: ctx.clicksThisHour },
      { regex: /total_clicks\s*(>|<|>=|<=|==|!=)\s*(\d+)/, value: ctx.totalClicks },
      { regex: /hour\s*(>|<|>=|<=|==|!=)\s*(\d+)/, value: ctx.hourOfDay },
      { regex: /day\s*(>|<|>=|<=|==|!=)\s*(\d+)/, value: ctx.dayOfWeek },
      { regex: /health_score\s*(>|<|>=|<=|==|!=)\s*(\d+)/, value: ctx.link.healthScore },
      { regex: /trust_score\s*(>|<|>=|<=|==|!=)\s*(\d+)/, value: ctx.link.trustScore },
    ];
    
    for (const { regex, value } of patterns) {
      const match = condition.match(regex);
      if (match) {
        const operator = match[1];
        const threshold = parseInt(match[2], 10);
        return this.compare(value, operator, threshold);
      }
    }
    
    if (condition === 'always') return true;
    if (condition === 'never') return false;
    
    return false;
  }
  
  private compare(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }
  
  async executeAction(link: Link, action: LinkScript['action'], params: Record<string, unknown>): Promise<void> {
    switch (action) {
      case 'redirect':
        break;
      case 'pause':
        break;
      case 'notify':
        break;
      case 'switch_target':
        break;
    }
  }
}

export const scriptEngine = new ScriptEngine();
