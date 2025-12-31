# Smart Shortener

Encurtador de links inteligente com redirecionamento dinâmico, proteção anti-fraude e analytics em tempo real.

![Next.js](https://img.shields.io/badge/Next.js-19-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Express](https://img.shields.io/badge/Express-4-green)

## Features

- Redirecionamento condicional (país, dispositivo, idioma, horário)
- Detecção de bots e cliques fraudulentos
- Analytics detalhado por link
- Scripts automáticos (pausar link, trocar destino, notificar)
- Limites de cliques e expiração
- API REST com autenticação
- Dashboard moderno com gráficos

## Requisitos

- Node.js 18+
- pnpm (para o frontend)

## Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/smart-shortener.git
cd smart-shortener

# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd frontend && pnpm install && cd ..

# Criar banco de dados
npm run db:migrate
npm run db:seed
```

## Rodando

```bash
# Backend + Frontend juntos
npm run dev:all

# Ou separadamente:
npm run dev          # Backend (porta 3002)
npm run dev:frontend # Frontend (porta 3000)
```

Acesse:
- **http://localhost:3000** - Dashboard
- **http://localhost:3002** - API

## Login Demo

```
Email: demo@example.com
Senha: demo123
```

A API Key é exibida no console ao rodar `npm run db:seed`.

## API

### Autenticação

Use o header `X-API-Key` ou Bearer token JWT.

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/links` | Listar links |
| POST | `/api/v1/links` | Criar link |
| GET | `/api/v1/links/:id` | Detalhes do link |
| PATCH | `/api/v1/links/:id` | Atualizar link |
| DELETE | `/api/v1/links/:id` | Excluir link |
| POST | `/api/v1/links/:id/pause` | Pausar link |
| POST | `/api/v1/links/:id/activate` | Ativar link |
| GET | `/api/v1/links/:id/analytics` | Analytics do link |
| GET | `/api/v1/links/:id/clicks` | Histórico de cliques |

### Exemplo: Criar link com regras

```bash
curl -X POST http://localhost:3002/api/v1/links \
  -H "X-API-Key: sua_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://exemplo.com",
    "customCode": "promo",
    "rules": [{
      "id": "1",
      "priority": 1,
      "conditions": [{ "field": "country", "operator": "eq", "value": "BR" }],
      "targetUrl": "https://exemplo.com/br",
      "active": true
    }],
    "limits": { "maxClicks": 10000 }
  }'
```

## Estrutura

```
├── src/                  # Backend (Express + TypeScript)
│   ├── api/              # Rotas e middlewares
│   ├── core/             # Redirect engine, fraud detector
│   ├── db/               # SQLite schema e conexão
│   ├── handlers/         # Request handlers
│   ├── repositories/     # Data access layer
│   ├── services/         # Webhooks, audit logs
│   └── server.ts         # Entry point
│
├── frontend/             # Frontend (Next.js 19)
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utils e mock data
│
└── data/                 # SQLite database (gitignore)
```

## Tech Stack

**Backend:**
- Express.js
- SQLite (better-sqlite3)
- Zod (validação)
- JWT + API Keys

**Frontend:**
- Next.js 19
- React 19
- Tailwind CSS 4
- Recharts
- Radix UI

## License

MIT
