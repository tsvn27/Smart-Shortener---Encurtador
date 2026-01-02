# 🔗 Smart Shortener

<div align="center">

![Smart Shortener](https://img.shields.io/badge/Smart-Shortener-6366f1?style=for-the-badge&logo=link&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

**Encurtador de links profissional com analytics avançado, proteção contra bots e autenticação 2FA.**

[Demo](https://smartshortener.vercel.app) · [API Docs](https://smart-shortener-encurtador-production.up.railway.app/api/docs) · [Reportar Bug](https://github.com/tsvn27/Smart-Shortener---Encurtador/issues)

</div>

---

## 📸 Screenshots

### Página Inicial
![Home](https://raw.githubusercontent.com/tsvn27/Smart-Shortener---Encurtador/main/screenshots/home.png)

### Dashboard
![Dashboard](https://raw.githubusercontent.com/tsvn27/Smart-Shortener---Encurtador/main/screenshots/dashboard.png)

### Detalhes do Link
![Link Details](https://raw.githubusercontent.com/tsvn27/Smart-Shortener---Encurtador/main/screenshots/link-details.png)

### Login
![Login](https://raw.githubusercontent.com/tsvn27/Smart-Shortener---Encurtador/main/screenshots/login.png)

---

## ✨ Funcionalidades

### 🔗 Links
- ✅ Encurtamento de URLs com códigos personalizados
- ✅ QR Code automático para cada link
- ✅ Pausar/ativar links
- ✅ Busca e filtros avançados
- ✅ Ordenação por data, cliques ou popularidade
- ✅ Limites de cliques e expiração
- ✅ Tags e campanhas

### 📊 Analytics
- ✅ Dashboard em tempo real
- ✅ Cliques por país, dispositivo e navegador
- ✅ Horários de pico
- ✅ Detecção de bots
- ✅ Exportar dados para CSV

### 🔐 Segurança
- ✅ Autenticação 2FA (Google Authenticator, Authy)
- ✅ Proteção contra SQL Injection e XSS
- ✅ Rate limiting por IP + fingerprint
- ✅ Detecção e bloqueio de bots
- ✅ Proteção contra brute force
- ✅ Honeypot para detectar bots
- ✅ Headers de segurança (Helmet + CSP)
- ✅ Cookies HTTP-Only com assinatura

### 🔌 Integrações
- ✅ API REST completa
- ✅ API Keys para acesso programático
- ✅ Webhooks para eventos
- ✅ Documentação OpenAPI/Swagger

---

## 🚀 Começando

### Pré-requisitos

- **Node.js 18+** - [Download](https://nodejs.org/)
- **MongoDB** - [Atlas (gratuito)](https://www.mongodb.com/cloud/atlas) ou local
- **pnpm** - `npm install -g pnpm`

### Instalação Passo a Passo

#### 1️⃣ Clone o repositório
```bash
git clone https://github.com/tsvn27/Smart-Shortener---Encurtador.git
cd Smart-Shortener---Encurtador
```

#### 2️⃣ Instale as dependências
```bash
# Backend
npm install

# Frontend
cd frontend && pnpm install && cd ..
```

#### 3️⃣ Configure o ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Abra e edite o .env com suas configurações
```

#### 4️⃣ Configure o MongoDB

**Opção A: MongoDB Atlas (Recomendado - Gratuito)**
1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um cluster (M0 Free)
4. Em "Database Access", crie um usuário com senha
5. Em "Network Access", adicione `0.0.0.0/0` (permite qualquer IP)
6. Clique em "Connect" → "Drivers" → Copie a URI
7. Cole no `.env`:
```env
MONGODB_URI=mongodb+srv://seu-usuario:sua-senha@cluster.mongodb.net/shortener?retryWrites=true&w=majority
```

**Opção B: MongoDB Local**
```bash
# Instale o MongoDB
# Windows: https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt install mongodb

# Inicie o serviço
# Windows: net start MongoDB
# Mac/Linux: sudo systemctl start mongod

# Use no .env:
MONGODB_URI=mongodb://localhost:27017/shortener
```

#### 5️⃣ Gere as chaves de segurança
```bash
# Execute no terminal para gerar chaves seguras:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('COOKIE_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Cole os valores gerados no .env
```

#### 6️⃣ Execute o projeto
```bash
npm run dev:all
```

#### 7️⃣ Acesse
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:3002
- **API Docs:** http://localhost:3002/api/docs

---

## ⚙️ Configuração do .env

```env
# ============================================
# SERVIDOR
# ============================================
PORT=3002
NODE_ENV=development

# ============================================
# FRONTEND
# ============================================
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_SHORT_DOMAIN=localhost:3002

# ============================================
# BANCO DE DADOS
# ============================================
# MongoDB Atlas:
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/shortener?retryWrites=true&w=majority
# Ou MongoDB Local:
# MONGODB_URI=mongodb://localhost:27017/shortener

# ============================================
# SEGURANÇA (OBRIGATÓRIO MUDAR!)
# ============================================
# Gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=sua-chave-super-secreta-aqui-minimo-32-caracteres
COOKIE_SECRET=outra-chave-super-secreta-aqui-minimo-32-caracteres

# ============================================
# EMAIL (Opcional - para recuperação de senha)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
FROM_EMAIL=noreply@seudominio.com

# ============================================
# URLs
# ============================================
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

---

## 🌐 Deploy

### Backend (Railway)

1. Acesse [Railway](https://railway.app)
2. Conecte com GitHub
3. New Project → Deploy from GitHub repo
4. Selecione o repositório
5. Configure as variáveis de ambiente (mesmas do .env)
6. Em Settings → Networking → Generate Domain

### Frontend (Vercel)

1. Acesse [Vercel](https://vercel.com)
2. Import Git Repository
3. **Root Directory:** `frontend`
4. Configure as variáveis:
   - `NEXT_PUBLIC_API_URL` = `https://seu-backend.railway.app/api/v1`
   - `NEXT_PUBLIC_SHORT_DOMAIN` = `seu-backend.railway.app`
5. Deploy

---

## 📚 API

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Criar conta |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Dados do usuário |
| POST | `/auth/forgot-password` | Recuperar senha |
| POST | `/auth/reset-password` | Redefinir senha |

### 2FA

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/2fa/setup` | Configurar 2FA |
| POST | `/auth/2fa/verify` | Ativar 2FA |
| POST | `/auth/2fa/disable` | Desativar 2FA |

### Links

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/links` | Listar links |
| POST | `/links` | Criar link |
| GET | `/links/:id` | Detalhes |
| PATCH | `/links/:id` | Atualizar |
| DELETE | `/links/:id` | Excluir |
| POST | `/links/:id/pause` | Pausar |
| POST | `/links/:id/activate` | Ativar |

### Analytics

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/stats/dashboard` | Stats do dashboard |
| GET | `/stats/analytics` | Analytics detalhado |
| GET | `/links/:id/analytics` | Analytics do link |
| GET | `/links/:id/export` | Exportar CSV |

### API Keys

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api-keys` | Listar chaves |
| POST | `/api-keys` | Criar chave |
| DELETE | `/api-keys/:id` | Excluir chave |

---

## 🛡️ Segurança

O Smart Shortener implementa múltiplas camadas de segurança:

- **Rate Limiting:** Limite de requisições por IP e fingerprint
- **Brute Force Protection:** Bloqueio após tentativas de login falhas
- **SQL Injection:** Validação e sanitização de inputs
- **XSS Protection:** Escape de caracteres especiais
- **CSRF Protection:** Tokens de validação
- **Bot Detection:** Análise de user-agent e comportamento
- **Honeypot:** Campos ocultos para detectar bots
- **2FA:** Autenticação de dois fatores com TOTP
- **Secure Cookies:** HTTP-Only, Secure, SameSite

---

## 📁 Estrutura do Projeto

```
├── src/                    # Backend (Express + TypeScript)
│   ├── api/               # Rotas e middlewares
│   │   ├── docs/          # Documentação OpenAPI
│   │   ├── middleware/    # Auth, validation
│   │   └── v1/            # Rotas v1
│   ├── db/                # MongoDB models
│   ├── lib/               # Utilitários (security, email, etc)
│   ├── repositories/      # Acesso a dados
│   └── server.ts          # Entry point
│
├── frontend/              # Frontend (Next.js)
│   ├── app/               # Páginas (App Router)
│   ├── components/        # Componentes React
│   └── lib/               # API client, utils
│
└── .env.example           # Exemplo de configuração
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

MIT © [tsvn27](https://github.com/tsvn27)

---

<div align="center">

**Feito com ❤️ e muito ☕**

</div>
