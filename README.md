# Smart Shortener

Encurtador de links inteligente com analytics avançado, proteção contra bots, autenticação 2FA e painel administrativo completo.

## Stack

**Backend:** Node.js, Express, TypeScript, SQLite, bcryptjs, JWT  
**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons

## Instalação

```bash
# Backend
npm install

# Frontend
cd frontend && pnpm install
```

## Executar

```bash
npm run dev:all
```

- Backend: http://localhost:3002  
- Frontend: http://localhost:3000

## Usuário Demo

```
Email: demo@example.com
Senha: demo123
```

## Funcionalidades

### Links
- Encurtamento de URLs com códigos personalizados
- QR Code para cada link
- Pausar/ativar links
- Regras de redirecionamento condicional
- Limites de cliques e expiração

### Analytics
- Dashboard com estatísticas em tempo real
- Cliques por país, dispositivo, navegador e horário
- Detecção de bots e cliques suspeitos
- Gráficos de performance
- Exportar dados para CSV

### Segurança
- Autenticação 2FA (TOTP - Google Authenticator, Authy)
- Cookies HTTP-Only com assinatura
- Rate limiting por IP + fingerprint
- Proteção contra SQL Injection e XSS
- Detecção e bloqueio de bots
- Headers de segurança (Helmet + CSP)
- Blacklist de IPs suspeitos

### Integrações
- API Keys para acesso programático
- Webhooks para eventos (cliques, criação de links)
- Recuperação de senha por email

### Interface
- Design moderno e responsivo
- Tema escuro
- Animações suaves
- Banner de consentimento de cookies

## API

Base URL: `http://localhost:3002/api/v1`

### Autenticação

```
POST   /auth/register          # Criar conta
POST   /auth/login             # Login (suporta 2FA)
POST   /auth/logout            # Logout
GET    /auth/me                # Dados do usuário
POST   /auth/forgot-password   # Solicitar reset de senha
POST   /auth/reset-password    # Redefinir senha
POST   /auth/change-password   # Alterar senha
PATCH  /auth/profile           # Atualizar perfil
DELETE /auth/account           # Excluir conta
POST   /auth/avatar            # Upload de foto
DELETE /auth/avatar            # Remover foto
```

### 2FA

```
GET    /auth/2fa/status        # Status do 2FA
POST   /auth/2fa/setup         # Configurar 2FA (retorna QR Code)
POST   /auth/2fa/verify        # Verificar e ativar 2FA
POST   /auth/2fa/disable       # Desativar 2FA
```

### Links

```
GET    /links                  # Listar links
POST   /links                  # Criar link
GET    /links/:id              # Detalhes do link
PATCH  /links/:id              # Atualizar link
DELETE /links/:id              # Excluir link
POST   /links/:id/pause        # Pausar link
POST   /links/:id/activate     # Ativar link
GET    /links/:id/analytics    # Analytics do link
GET    /links/:id/clicks       # Lista de cliques
GET    /links/:id/export       # Exportar CSV
```

### Estatísticas

```
GET    /stats/public           # Stats públicas (home)
GET    /stats/dashboard        # Stats do dashboard
```

### API Keys

```
GET    /api-keys               # Listar chaves
POST   /api-keys               # Criar chave
DELETE /api-keys/:id           # Excluir chave
```

### Webhooks

```
GET    /webhooks               # Listar webhooks
POST   /webhooks               # Criar webhook
PATCH  /webhooks/:id           # Atualizar webhook
DELETE /webhooks/:id           # Excluir webhook
```

## Variáveis de Ambiente

### Backend (.env)

```env
PORT=3002
JWT_SECRET=sua-chave-secreta-muito-segura
COOKIE_SECRET=cookie-secret-muito-seguro
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
FROM_EMAIL=noreply@seudominio.com
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Frontend (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_SHORT_DOMAIN=localhost:3002
```

## Estrutura do Projeto

```
├── src/                    # Backend
│   ├── api/               # Rotas e middlewares
│   ├── core/              # Lógica de negócio
│   ├── db/                # Banco de dados
│   ├── handlers/          # Handlers de requisição
│   ├── lib/               # Utilitários
│   ├── repositories/      # Acesso a dados
│   ├── services/          # Serviços
│   └── server.ts          # Entry point
├── frontend/              # Frontend Next.js
│   ├── app/               # Páginas (App Router)
│   ├── components/        # Componentes React
│   ├── lib/               # Utilitários e API client
│   └── public/            # Assets estáticos
├── data/                  # Banco SQLite
└── logs/                  # Arquivos de log
```

## Scripts

```bash
npm run dev          # Backend em modo dev
npm run build        # Build completo
npm run dev:all      # Backend + Frontend
```

## Licença

MIT
