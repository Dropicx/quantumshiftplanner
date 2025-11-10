# Railway.app Deployment - Multi-Dockerfile Setup

## 🚂 Railway.app Übersicht

Railway ist eine moderne PaaS-Plattform mit:
- ✅ Git-basierte Deployments
- ✅ Native Plugins (PostgreSQL, Redis, etc.)
- ✅ Automatische SSL
- ✅ Environment Variables Management
- ✅ Kostenloser Start (500h/Monat)
- ✅ Multi-Service Support

---

## 📁 Projekt-Struktur für Railway

```
planday-clone/
├── dockerfiles/
│   ├── Dockerfile.web          # Next.js Frontend
│   ├── Dockerfile.api          # NestJS Backend API
│   ├── Dockerfile.worker       # BullMQ Worker
│   └── Dockerfile.mobile-api   # Optional: Mobile API
├── apps/
│   ├── web/                    # Next.js App
│   ├── api/                    # NestJS API
│   └── worker/                 # Worker Service
├── packages/
│   ├── database/               # Shared DB Package
│   ├── types/                  # Shared Types
│   └── config/                 # Shared Config
├── railway.json                # Railway Config
├── railway.toml                # Alternative Config
└── package.json                # Root Package
```

---

## 🐳 Dockerfiles

### 1. Dockerfile.web (Next.js Frontend)

```dockerfile
# dockerfiles/Dockerfile.web

# --- Base Stage ---
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# --- Dependencies Stage ---
FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared packages first
RUN pnpm --filter @planday/database build
RUN pnpm --filter @planday/types build

# Build web app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm --filter @planday/web build

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public

# Set the correct permission for prerender cache
RUN mkdir -p apps/web/.next
RUN chown nextjs:nodejs apps/web/.next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
```

### 2. Dockerfile.api (NestJS Backend)

```dockerfile
# dockerfiles/Dockerfile.api

# --- Base Stage ---
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# --- Dependencies Stage ---
FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared packages
RUN pnpm --filter @planday/database build
RUN pnpm --filter @planday/types build

# Build API
ENV NODE_ENV=production
RUN pnpm --filter @planday/api build

# Prune dev dependencies
RUN pnpm prune --prod

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

USER nestjs

EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/api/dist/main.js"]
```

### 3. Dockerfile.worker (BullMQ Worker)

```dockerfile
# dockerfiles/Dockerfile.worker

# --- Base Stage ---
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# --- Dependencies Stage ---
FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
RUN pnpm install --frozen-lockfile

# --- Builder Stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared packages
RUN pnpm --filter @planday/database build
RUN pnpm --filter @planday/types build

# Build Worker
ENV NODE_ENV=production
RUN pnpm --filter @planday/worker build

# Prune dev dependencies
RUN pnpm prune --prod

# --- Runner Stage ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 workeruser

# Copy built application
COPY --from=builder --chown=workeruser:nodejs /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder --chown=workeruser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=workeruser:nodejs /app/packages ./packages

USER workeruser

CMD ["node", "apps/worker/dist/main.js"]
```

---

## 🎯 Railway Configuration

### Option 1: railway.json (empfohlen)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Option 2: railway.toml

```toml
[build]
builder = "DOCKERFILE"

[deploy]
numReplicas = 1
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

## 📦 Worker Service Setup

Erstelle `apps/worker/` für Background Jobs:

```typescript
// apps/worker/src/main.ts
import { Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Email Worker
const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    console.log('Processing email job:', job.id);
    
    const { to, subject, html } = job.data;
    
    // Send email using Postal or Amazon SES
    await sendEmail({ to, subject, html });
    
    return { success: true };
  },
  { connection }
);

// Notification Worker
const notificationWorker = new Worker(
  'notification-queue',
  async (job) => {
    console.log('Processing notification job:', job.id);
    
    const { userId, title, body, type } = job.data;
    
    // Send push notification
    await sendPushNotification({ userId, title, body, type });
    
    return { success: true };
  },
  { connection }
);

// Report Worker
const reportWorker = new Worker(
  'report-queue',
  async (job) => {
    console.log('Processing report job:', job.id);
    
    const { reportType, organizationId, dateRange } = job.data;
    
    // Generate report
    const report = await generateReport({ reportType, organizationId, dateRange });
    
    // Upload to storage
    await uploadReport(report);
    
    return { reportUrl: report.url };
  },
  { connection }
);

console.log('🚀 Workers started!');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...');
  await emailWorker.close();
  await notificationWorker.close();
  await reportWorker.close();
  process.exit(0);
});
```

```json
// apps/worker/package.json
{
  "name": "@planday/worker",
  "version": "1.0.0",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "dev": "tsx watch src/main.ts"
  },
  "dependencies": {
    "bullmq": "^5.22.0",
    "ioredis": "^5.4.0",
    "@planday/database": "workspace:*",
    "@planday/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0"
  }
}
```

---

## 🚀 Deployment zu Railway

### Schritt 1: Railway CLI installieren

```bash
# macOS/Linux
brew install railway

# oder npm
npm install -g @railway/cli

# Login
railway login
```

### Schritt 2: Projekt erstellen

```bash
# Im Projekt-Root
railway init

# Oder via Web
# https://railway.app/new
```

### Schritt 3: Services hinzufügen

#### 1. PostgreSQL (Plugin)

```bash
# Via CLI
railway add --plugin postgresql

# Oder via Dashboard:
# New Service → Database → PostgreSQL
```

**Environment Variables (automatisch):**
```
DATABASE_URL
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
```

#### 2. Redis (Plugin)

```bash
# Via CLI
railway add --plugin redis

# Oder via Dashboard:
# New Service → Database → Redis
```

**Environment Variables (automatisch):**
```
REDIS_URL
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
```

#### 3. Web Service (Next.js)

**Via Dashboard:**
1. New Service → GitHub Repo
2. Settings → Environment:
   - `RAILWAY_DOCKERFILE_PATH` = `dockerfiles/Dockerfile.web`
3. Add Environment Variables:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=<generate-with-openssl>
```

#### 4. API Service (NestJS)

**Via Dashboard:**
1. New Service → GitHub Repo (same repo)
2. Settings → Environment:
   - `RAILWAY_DOCKERFILE_PATH` = `dockerfiles/Dockerfile.api`
3. Add Environment Variables:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<your-jwt-secret>
CORS_ORIGIN=${{web.RAILWAY_PUBLIC_DOMAIN}}
```

#### 5. Worker Service

**Via Dashboard:**
1. New Service → GitHub Repo (same repo)
2. Settings → Environment:
   - `RAILWAY_DOCKERFILE_PATH` = `dockerfiles/Dockerfile.worker`
3. Add Environment Variables:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
EMAIL_FROM=noreply@yourdomain.com
```

---

## 🔗 Service Verbindungen in Railway

Railway nutzt **Template Variables** für Service-zu-Service Kommunikation:

```env
# In Web Service
NEXT_PUBLIC_API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}

# In API Service  
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# In Worker Service
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

**Private Networking (für interne Kommunikation):**
```env
# API intern erreichbar (kein HTTPS overhead)
API_INTERNAL_URL=http://${{api.RAILWAY_PRIVATE_DOMAIN}}:3001
```

---

## 📋 Environment Variables - Komplett

### Shared (alle Services)

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### Web Service (Next.js)

```env
# Public
NEXT_PUBLIC_API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_WS_URL=wss://${{api.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Private
NEXTAUTH_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=<openssl rand -base64 32>
DATABASE_URL=${{Postgres.DATABASE_URL}}

# OAuth (optional)
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>
```

### API Service (NestJS)

```env
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://${{web.RAILWAY_PUBLIC_DOMAIN}}

# File Storage
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_REGION=eu-central-1
AWS_S3_BUCKET=planday-files

# Email
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=<your-smtp>
SMTP_PORT=587
SMTP_USER=<your-user>
SMTP_PASSWORD=<your-password>

# Or Amazon SES
AWS_SES_REGION=eu-central-1
AWS_SES_FROM=noreply@yourdomain.com
```

### Worker Service

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Email
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=<your-smtp>
SMTP_PORT=587
SMTP_USER=<your-user>
SMTP_PASSWORD=<your-password>

# Push Notifications
FCM_SERVER_KEY=<your-fcm-key>

# File Storage (same as API)
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_REGION=eu-central-1
AWS_S3_BUCKET=planday-files
```

---

## 🔄 CI/CD Pipeline

Railway auto-deployed bei Git Push:

```yaml
# .github/workflows/railway-deploy.yml (optional für Preview)
name: Railway Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy to Railway
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 💰 Railway Kosten

### Free Tier
```
500 Stunden/Monat kostenlos
= ~€5 Wert
Perfekt für Development/Testing
```

### Hobby Plan ($5/Monat)
```
$5/Monat + Usage
Keine Stunden-Limits
Ideal für kleine Projekte
```

### Kosten-Schätzung (Production)

**Small (1000 User):**
```
PostgreSQL: $5-10/Monat
Redis: $5/Monat
Web (1 Instance): $5-10/Monat
API (2 Instances): $10-20/Monat
Worker: $5-10/Monat
──────────────────────────
Total: ~$30-55/Monat
```

**Medium (10K User):**
```
PostgreSQL: $20-30/Monat
Redis: $10-15/Monat
Web (2-3 Instances): $20-40/Monat
API (3-4 Instances): $30-50/Monat
Worker (2 Instances): $10-20/Monat
──────────────────────────
Total: ~$90-155/Monat
```

---

## 📊 Monitoring in Railway

Railway bietet Built-in Monitoring:
- ✅ CPU Usage
- ✅ Memory Usage
- ✅ Network Traffic
- ✅ Deployment Logs
- ✅ Custom Metrics

**Zusätzlich: Externe Monitoring**
```env
# In allen Services
SENTRY_DSN=<your-sentry-dsn>
```

---

## 🔧 Troubleshooting

### Build Fehler

```bash
# Lokaler Build Test
docker build -f dockerfiles/Dockerfile.web -t planday-web .
docker run -p 3000:3000 planday-web

# Railway Logs
railway logs --service web
```

### Environment Variables

```bash
# Liste alle Vars
railway variables

# Setze Variable
railway variables set KEY=value

# Lösche Variable
railway variables delete KEY
```

### Service Neustart

```bash
# Via CLI
railway restart --service api

# Oder im Dashboard: Service → Settings → Restart
```

### Database Migrations

```bash
# Via Railway CLI
railway run npm run db:migrate

# Oder als Deployment Hook
# railway.json:
{
  "deploy": {
    "startCommand": "npm run db:migrate && npm start"
  }
}
```

---

## 🚦 Deployment Checklist

### Vor dem ersten Deploy:

- [ ] Alle Dockerfiles getestet
- [ ] Environment Variables gesetzt
- [ ] PostgreSQL Plugin hinzugefügt
- [ ] Redis Plugin hinzugefügt
- [ ] Domain konfiguriert (optional)
- [ ] SSL automatisch aktiviert (Railway macht das)

### Nach dem Deploy:

- [ ] Alle Services laufen (grüner Status)
- [ ] Web App erreichbar
- [ ] API antwortet
- [ ] Worker verarbeitet Jobs
- [ ] Logs prüfen
- [ ] Database Migrations gelaufen

---

## 🌐 Custom Domain

```bash
# Via Dashboard
# Service → Settings → Networking → Custom Domain
# Dann CNAME Record bei deinem DNS Provider:
# www.yourdomain.com → <railway-domain>.railway.app
```

**SSL:**
Railway managed SSL automatisch via Let's Encrypt!

---

## 📈 Scaling

### Horizontal Scaling

```bash
# Im Dashboard
# Service → Settings → Replicas
# Setze auf 2-10 Replicas
```

### Vertical Scaling

Railway skaliert automatisch bis zu:
- 8 GB RAM
- 8 vCPU

---

## 🔐 Secrets Management

```bash
# Nie in Git committen!
# Nutze Railway Secrets:
railway variables set DATABASE_PASSWORD=<secret>

# Oder via .env (lokal only)
# .gitignore:
.env.local
.env.production
```

---

## 🎯 Best Practices

1. **Use Private Networking** für Service-zu-Service Kommunikation
2. **Health Checks** implementieren in jedem Service
3. **Graceful Shutdown** in Dockerfiles
4. **Multi-Stage Builds** für kleinere Images
5. **Cache Layers** optimal nutzen
6. **Environment Separation** (dev, staging, prod)
7. **Monitoring** von Anfang an einbauen
8. **Backups** für PostgreSQL aktivieren
9. **Rate Limiting** in API implementieren
10. **Security Headers** in Next.js setzen

---

## ✅ Fertig!

Nach diesem Setup hast du:
- ✅ Multi-Service Deployment auf Railway
- ✅ Automatische CI/CD
- ✅ Managed PostgreSQL & Redis
- ✅ Auto-Scaling
- ✅ SSL/HTTPS
- ✅ Monitoring
- ✅ ~$30-55/Monat für 1000 User

**Start hier: Railway Dashboard erstellen und Services deployen!** 🚀
