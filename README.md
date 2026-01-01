# Smart Shortener

Encurtador de links inteligente com analytics avançado, proteção contra bots, autenticação 2FA e painel administrativo completo.

## Stack

**Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT  
**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons

## Pré-requisitos

- Node.js 18+
- MongoDB (local ou Atlas)
- pnpm (para o frontend)

## Instalação

```bash
# Backend
npm install

# Frontend
cd frontend && pnpm install
```

## Configuração

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Configure as variáveis no `.env` (veja seção Variáveis de Ambiente)

3. (Opcional) Rode o seed para criar usuário demo:
```bash
npm run seed
```

## Executar

```bash
npm run dev:all
```

- Backend: http://localhost:3002  
- Frontend: http://localhost:3000
- API Docs: http://localhost:3002/api/docs

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
- Busca e filtros avançados
- Ordenação por data, cliques totais ou cliques do dia
- Regras de redirecionamento condicional
- Limites de cliques e expiração

### Analytics
- Dashboard com estatísticas em tempo real
- Cliques por país, dispositivo, navegador e horário (dados reais)
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
- Documentação OpenAPI/Swagger

### Interface
- Design moderno e responsivo
- Tema escuro
- Animações suaves
- Banner de consentimento de cookies

## Documentação da API

Acesse a documentação interativa em: http://localhost:3002/api/docs

### Endpoints Principais

#### Autenticação
```
POST   /auth/register          # Criar conta
POST   /auth/login             # Login (suporta 2FA)
POST   /auth/logout            # Logout
GET    /auth/me                # Dados do usuário
POST   /auth/forgot-password   # Solicitar reset de senha
POST   /auth/reset-password    # Redefinir senha
POST   /auth/change-password   # Alterar senha
```

#### 2FA
```
POST   /auth/2fa/setup         # Configurar 2FA (retorna QR Code)
POST   /auth/2fa/verify        # Verificar e ativar 2FA
POST   /auth/2fa/disable       # Desativar 2FA
```

#### Links
```
GET    /links                  # Listar links (com busca, filtros e ordenação)
POST   /links                  # Criar link
GET    /links/:id              # Detalhes do link
PATCH  /links/:id              # Atualizar link
DELETE /links/:id              # Excluir link
POST   /links/:id/pause        # Pausar link
POST   /links/:id/activate     # Ativar link
```

#### Analytics
```
GET    /stats/public           # Stats públicas (home)
GET    /stats/dashboard        # Stats do dashboard
GET    /stats/analytics        # Analytics detalhado (países, dispositivos, horários)
GET    /links/:id/analytics    # Analytics do link
GET    /links/:id/clicks       # Lista de cliques
GET    /links/:id/export       # Exportar CSV
```

#### API Keys & Webhooks
```
GET    /api-keys               # Listar chaves
POST   /api-keys               # Criar chave
DELETE /api-keys/:id           # Excluir chave
GET    /webhooks               # Listar webhooks
POST   /webhooks               # Criar webhook
DELETE /webhooks/:id           # Excluir webhook
```

## Variáveis de Ambiente

O projeto usa um único arquivo `.env` na raiz para backend e frontend:

```env
# Servidor
PORT=3002
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_SHORT_DOMAIN=localhost:3002

# MongoDB
MONGODB_URI=mongodb://localhost:27017/shortener

# Segurança (ALTERAR EM PRODUÇÃO!)
JWT_SECRET=sua-chave-secreta-muito-segura-min-32-chars
COOKIE_SECRET=outra-chave-secreta-muito-segura

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
FROM_EMAIL=noreply@seudominio.com

# URLs
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

## Estrutura do Projeto

```
├── src/                    # Backend
│   ├── api/               # Rotas, middlewares e docs
│   ├── core/              # Lógica de negócio
│   ├── db/                # Models e conexão MongoDB
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
└── logs/                  # Arquivos de log
```

## Scripts

```bash
npm run dev          # Backend em modo dev
npm run dev:all      # Backend + Frontend
npm run build        # Build completo
npm run seed         # Criar usuário demo
```

## Licença

MIT
