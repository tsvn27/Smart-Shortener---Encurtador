# Smart Shortener

Encurtador de links com redirecionamento dinâmico, anti-fraude e analytics.

## Setup

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Backend roda em `http://localhost:3002`

Login: `demo@example.com` / `demo123`

## API

```bash
curl -H "X-API-Key: sk_live_xxx" http://localhost:3002/api/v1/links
```

### Criar link

```bash
curl -X POST http://localhost:3002/api/v1/links \
  -H "X-API-Key: sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "customCode": "meu-link",
    "rules": [{
      "id": "1",
      "priority": 1,
      "conditions": [{ "field": "country", "operator": "eq", "value": "BR" }],
      "targetUrl": "https://example.com/br",
      "active": true
    }],
    "limits": { "maxClicks": 10000 }
  }'
```

## Estrutura

```
src/
├── api/          # Rotas e middlewares
├── core/         # Redirect engine, fraud detector, scripts
├── db/           # Schema e conexão
├── handlers/     # Request handlers
├── repositories/ # Data access
├── services/     # Webhooks, audit
└── server.ts
```
