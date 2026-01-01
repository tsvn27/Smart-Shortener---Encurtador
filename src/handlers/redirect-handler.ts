import { Request, Response } from 'express';
import { createHash } from 'crypto';
import { linkRepository } from '../repositories/link-repository.js';
import { clickRepository } from '../repositories/click-repository.js';
import { redirectEngine } from '../core/redirect-engine.js';
import { fraudDetector } from '../core/fraud-detector.js';
import { scriptEngine } from '../core/script-engine.js';
import { parseContext, getClientIp, getHeaders } from '../core/context-parser.js';
import { webhookService } from '../services/webhook-service.js';

export async function handleRedirect(req: Request, res: Response) {
  const startTime = Date.now();
  const shortCode = req.params.code;
  
  const link = linkRepository.findByShortCode(shortCode);
  
  if (!link) {
    return res.status(404).redirect('/not-found');
  }
  
  const context = parseContext(req);
  const ip = getClientIp(req);
  const headers = getHeaders(req);
  
  const fraudAnalysis = fraudDetector.analyze({
    ip,
    userAgent: req.headers['user-agent'] || '',
    headers,
    context,
  });
  
  const { url: targetUrl, ruleId } = redirectEngine.resolveTarget(link, context);
  
  const scriptResults = scriptEngine.evaluate(link);
  for (const result of scriptResults) {
    if (result.triggered && result.action && result.params) {
      await scriptEngine.executeAction(link, result.action, result.params);
    }
  }
  
  const ipHash = createHash('sha256').update(ip).digest('hex').substring(0, 16);
  const isNewVisitor = !clickRepository.hasClickedBefore(link.id, ipHash);
  
  const responseTime = Date.now() - startTime;
  
  clickRepository.create({
    linkId: link.id,
    ip,
    ipHash,
    userAgent: req.headers['user-agent'] || '',
    fingerprint: fraudAnalysis.fingerprint,
    country: context.country,
    device: context.device || 'unknown',
    os: context.os || 'unknown',
    browser: context.browser || 'unknown',
    language: context.language,
    referrer: context.referrer,
    isBot: fraudAnalysis.isBot,
    isSuspicious: fraudAnalysis.isSuspicious,
    fraudScore: fraudAnalysis.fraudScore,
    fraudReasons: fraudAnalysis.reasons,
    redirectedTo: targetUrl,
    ruleApplied: ruleId,
    responseTimeMs: responseTime,
  });
  
  linkRepository.incrementClicks(link.id);
  if (isNewVisitor) {
    linkRepository.incrementUniqueClicks(link.id);
  }
  
  webhookService.trigger(link.ownerId, 'link.clicked', {
    linkId: link.id,
    shortCode: link.shortCode,
    targetUrl,
    country: context.country,
    device: context.device,
    isBot: fraudAnalysis.isBot,
    timestamp: new Date().toISOString(),
  }).catch(() => {});
  
  res.redirect(302, targetUrl);
}

export function handlePreview(req: Request, res: Response) {
  const shortCode = req.params.code;
  const link = linkRepository.findByShortCode(shortCode);
  
  if (!link) {
    return res.status(404).json({ error: 'Link não encontrado' });
  }
  
  res.json({
    shortCode: link.shortCode,
    targetUrl: link.defaultTargetUrl,
    state: link.state,
    totalClicks: link.totalClicks,
    createdAt: link.createdAt,
  });
}
