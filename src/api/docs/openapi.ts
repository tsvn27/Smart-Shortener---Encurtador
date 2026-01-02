import { Router } from 'express';

const router = Router();

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Smart Shortener API',
    description: 'API para encurtamento de links com analytics avançado',
    version: '1.0.0',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  tags: [
    { name: 'Auth', description: 'Autenticação e conta' },
    { name: '2FA', description: 'Autenticação de dois fatores' },
    { name: 'Links', description: 'Gerenciamento de links' },
    { name: 'Analytics', description: 'Estatísticas e métricas' },
    { name: 'API Keys', description: 'Chaves de API' },
    { name: 'Webhooks', description: 'Notificações de eventos' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {},
};

const endpoints = [
  { method: 'POST', path: '/auth/register', tag: 'Auth', desc: 'Criar conta', auth: false },
  { method: 'POST', path: '/auth/login', tag: 'Auth', desc: 'Login (suporta 2FA)', auth: false },
  { method: 'POST', path: '/auth/logout', tag: 'Auth', desc: 'Logout', auth: true },
  { method: 'GET', path: '/auth/me', tag: 'Auth', desc: 'Dados do usuário', auth: true },
  { method: 'POST', path: '/auth/forgot-password', tag: 'Auth', desc: 'Solicitar reset de senha', auth: false },
  { method: 'POST', path: '/auth/reset-password', tag: 'Auth', desc: 'Redefinir senha', auth: false },
  { method: 'POST', path: '/auth/change-password', tag: 'Auth', desc: 'Alterar senha', auth: true },
  { method: 'PATCH', path: '/auth/profile', tag: 'Auth', desc: 'Atualizar perfil', auth: true },
  { method: 'DELETE', path: '/auth/account', tag: 'Auth', desc: 'Excluir conta', auth: true },
  { method: 'POST', path: '/auth/avatar', tag: 'Auth', desc: 'Upload de foto', auth: true },
  { method: 'DELETE', path: '/auth/avatar', tag: 'Auth', desc: 'Remover foto', auth: true },
  { method: 'POST', path: '/auth/2fa/setup', tag: '2FA', desc: 'Configurar 2FA', auth: true },
  { method: 'POST', path: '/auth/2fa/verify', tag: '2FA', desc: 'Verificar e ativar', auth: true },
  { method: 'POST', path: '/auth/2fa/disable', tag: '2FA', desc: 'Desativar 2FA', auth: true },
  { method: 'GET', path: '/links', tag: 'Links', desc: 'Listar links', auth: true },
  { method: 'POST', path: '/links', tag: 'Links', desc: 'Criar link', auth: true },
  { method: 'GET', path: '/links/:id', tag: 'Links', desc: 'Detalhes do link', auth: true },
  { method: 'PATCH', path: '/links/:id', tag: 'Links', desc: 'Atualizar link', auth: true },
  { method: 'DELETE', path: '/links/:id', tag: 'Links', desc: 'Excluir link', auth: true },
  { method: 'POST', path: '/links/:id/pause', tag: 'Links', desc: 'Pausar link', auth: true },
  { method: 'POST', path: '/links/:id/activate', tag: 'Links', desc: 'Ativar link', auth: true },
  { method: 'GET', path: '/stats/public', tag: 'Analytics', desc: 'Stats públicas', auth: false },
  { method: 'GET', path: '/stats/dashboard', tag: 'Analytics', desc: 'Stats do dashboard', auth: true },
  { method: 'GET', path: '/stats/analytics', tag: 'Analytics', desc: 'Analytics detalhado', auth: true },
  { method: 'GET', path: '/links/:id/analytics', tag: 'Analytics', desc: 'Analytics do link', auth: true },
  { method: 'GET', path: '/links/:id/clicks', tag: 'Analytics', desc: 'Lista de cliques', auth: true },
  { method: 'GET', path: '/links/:id/export', tag: 'Analytics', desc: 'Exportar CSV', auth: true },
  { method: 'GET', path: '/api-keys', tag: 'API Keys', desc: 'Listar chaves', auth: true },
  { method: 'POST', path: '/api-keys', tag: 'API Keys', desc: 'Criar chave', auth: true },
  { method: 'DELETE', path: '/api-keys/:id', tag: 'API Keys', desc: 'Excluir chave', auth: true },
  { method: 'GET', path: '/webhooks', tag: 'Webhooks', desc: 'Listar webhooks', auth: true },
  { method: 'POST', path: '/webhooks', tag: 'Webhooks', desc: 'Criar webhook', auth: true },
  { method: 'PATCH', path: '/webhooks/:id', tag: 'Webhooks', desc: 'Atualizar webhook', auth: true },
  { method: 'DELETE', path: '/webhooks/:id', tag: 'Webhooks', desc: 'Excluir webhook', auth: true },
];

router.get('/openapi.json', (_req, res) => res.json(openApiSpec));

router.get('/', (req, res) => {
  const methodColors: Record<string, string> = {
    GET: '#22c55e',
    POST: '#6366f1',
    PATCH: '#f59e0b',
    DELETE: '#ef4444',
    PUT: '#8b5cf6',
  };

  const groupedEndpoints = endpoints.reduce((acc, ep) => {
    if (!acc[ep.tag]) acc[ep.tag] = [];
    acc[ep.tag].push(ep);
    return acc;
  }, {} as Record<string, typeof endpoints>);

  const baseUrl = process.env.NODE_ENV === 'production' 
    ? `https://${req.get('host')}` 
    : `http://${req.get('host')}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Docs - Smart Shortener</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%236366f1'/%3E%3Cpath d='M10 16h12M18 12l4 4-4 4' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0b;
      color: #fafafa;
      min-height: 100vh;
      line-height: 1.6;
    }
    .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
    .header { margin-bottom: 48px; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .logo-icon {
      width: 40px; height: 40px; background: #6366f1; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-icon svg { width: 24px; height: 24px; }
    .logo-text { font-size: 24px; font-weight: 600; }
    .logo-text span { color: #6366f1; }
    h1 { font-size: 32px; font-weight: 600; margin-bottom: 8px; }
    .subtitle { color: #71717a; font-size: 16px; }
    .base-url {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2);
      padding: 8px 16px; border-radius: 8px; margin-top: 16px; font-family: monospace; font-size: 14px;
    }
    .base-url code { color: #a5b4fc; }
    .section { margin-bottom: 32px; }
    .section-title {
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;
      color: #71717a; margin-bottom: 12px; padding-left: 4px;
    }
    .card {
      background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px; overflow: hidden;
    }
    .endpoint {
      display: flex; align-items: center; gap: 12px; padding: 14px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04); transition: background 0.15s;
    }
    .endpoint:last-child { border-bottom: none; }
    .endpoint:hover { background: rgba(255, 255, 255, 0.03); }
    .method {
      font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px;
      min-width: 60px; text-align: center; font-family: monospace;
    }
    .path { font-family: monospace; font-size: 14px; color: #e4e4e7; flex: 1; }
    .path span { color: #6366f1; }
    .desc { font-size: 13px; color: #71717a; }
    .auth-badge {
      font-size: 10px; padding: 2px 6px; border-radius: 4px;
      background: rgba(99, 102, 241, 0.15); color: #a5b4fc;
    }
    .info-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 32px; }
    .info-card {
      background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px; padding: 20px;
    }
    .info-card h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .info-card p { font-size: 13px; color: #71717a; }
    .info-card code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .copy-btn {
      background: transparent; border: none; color: #71717a; cursor: pointer; padding: 4px;
      border-radius: 4px; transition: all 0.15s;
    }
    .copy-btn:hover { color: #fafafa; background: rgba(255,255,255,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M15 6l6 6-6 6"/>
          </svg>
        </div>
        <div class="logo-text">Smart<span>.</span></div>
      </div>
      <h1>API Documentation</h1>
      <p class="subtitle">Documentação completa da API REST do Smart Shortener</p>
      <div class="base-url">
        <span>Base URL:</span>
        <code>${baseUrl}/api/v1</code>
        <button class="copy-btn" onclick="navigator.clipboard.writeText('${baseUrl}/api/v1')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
    </div>

    ${Object.entries(groupedEndpoints).map(([tag, eps]) => `
      <div class="section">
        <div class="section-title">${tag}</div>
        <div class="card">
          ${eps.map(ep => `
            <div class="endpoint">
              <span class="method" style="background: ${methodColors[ep.method]}20; color: ${methodColors[ep.method]}">${ep.method}</span>
              <span class="path">${ep.path.replace(/:(\w+)/g, '<span>:$1</span>')}</span>
              <span class="desc">${ep.desc}</span>
              ${ep.auth ? '<span class="auth-badge">Auth</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}

    <div class="info-cards">
      <div class="info-card">
        <h3>🔐 Autenticação</h3>
        <p>Use o header <code>Authorization: Bearer TOKEN</code> para endpoints autenticados.</p>
      </div>
      <div class="info-card">
        <h3>📊 Rate Limiting</h3>
        <p>100 requests/minuto para endpoints gerais, 10/minuto para auth.</p>
      </div>
      <div class="info-card">
        <h3>🔑 API Keys</h3>
        <p>Use <code>X-API-Key: sua-chave</code> para acesso programático.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  res.send(html);
});

export default router;
