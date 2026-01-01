# Encurtador de Links

Sistema completo de encurtamento de URLs com analytics, detecção de bots e painel administrativo.

## Stack

**Backend:** Node.js, Express, TypeScript, SQLite  
**Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, Recharts

## Instalação

```bash
npm install
cd frontend && pnpm install
```

## Executar

```bash
npm run dev:all
```

Backend: http://localhost:3002  
Frontend: http://localhost:3000

## Usuário Demo

```
Email: demo@example.com
Senha: demo123
```

## Funcionalidades

- Encurtamento de URLs com códigos personalizados
- Analytics detalhado (cliques, países, dispositivos, horários)
- Detecção de bots e cliques suspeitos
- Regras de redirecionamento condicional
- QR Code para cada link
- Exportar analytics para CSV
- API Keys para integração
- Webhooks para eventos
- Recuperação de senha
- Rate limiting
- Cache em memória
- Logs estruturados

## API

Base URL: `http://localhost:3002/api/v1`

### Autenticação

```
POST /auth/register
POST /auth/login
GET  /auth/me
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/change-password
PATCH /auth/profile
DELETE /auth/account
```

### Links

```
GET    /links
POST   /links
GET    /links/:id
PATCH  /links/:id
DELETE /links/:id
POST   /links/:id/pause
POST   /links/:id/activate
GET    /links/:id/analytics
GET    /links/:id/clicks
GET    /links/:id/export
```

### API Keys & Webhooks

```
GET    /api-keys
POST   /api-keys
DELETE /api-keys/:id

GET    /webhooks
POST   /webhooks
PATCH  /webhooks/:id
DELETE /webhooks/:id
```

## Variáveis de Ambiente

### Backend (.env)

```env
PORT=3002
JWT_SECRET=sua-chave-secreta
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email
SMTP_PASS=sua-senha
FROM_EMAIL=noreply@seudominio.com
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

### Frontend (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_SHORT_DOMAIN=localhost:3002
```
