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

✅ **Worker Service ist bereits implementiert!** (siehe `apps/worker/`)

Der Worker Service nutzt **NestJS + BullMQ** für Background Job Processing:

### Implementierte Job Processors

**1. Email Processor** (`email-queue`)

- Shift-Benachrichtigungen
- Passwort-Reset Emails
- Welcome Emails
- Concurrency: 5 Jobs parallel

**2. Notification Processor** (`notification-queue`)

- Push Notifications via Firebase FCM
- In-App Benachrichtigungen
- Concurrency: 10 Jobs parallel

**3. Report Processor** (`report-queue`)

- Payroll Reports (PDF/CSV/XLSX)
- Attendance Reports
- Analytics Export
- Concurrency: 2 Jobs parallel (ressourcenintensiv)

### Architektur

```typescript
// apps/worker/src/main.ts (vereinfacht)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Minimal HTTP Server nur für Health Checks
  app.setGlobalPrefix('api');
  await app.listen(4001, '0.0.0.0');

  console.log('⚙️ Worker Service is running!');
  console.log('🔄 Processing jobs from Redis...');
}
```

> **Vollständige Implementierung:** Siehe `apps/worker/src/` für den kompletten Code

### Health Checks

Der Worker Service bietet Health Check Endpoints für Railway:

```bash
GET /api/health        # Basic health check
GET /api/health/ready  # Readiness probe (Redis connected)
GET /api/health/live   # Liveness probe (Service running)
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

#### 5. Worker Service (Background Jobs)

**Via Dashboard:**

1. New Service → GitHub Repo (same repo)
2. Settings → Root Directory: `/`
3. Settings → Environment:
   - `RAILWAY_DOCKERFILE_PATH` = `dockerfiles/Dockerfile.worker`
4. Add Environment Variables:

```env
# Core
NODE_ENV=production
PORT=8080

# Database & Cache
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Clerk Authentication (für User Sync)
CLERK_SECRET_KEY=<your-clerk-secret-key>
CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>

# Maileroo Email Service
MAILEROO_API_KEY=<your-maileroo-api-key>
MAILEROO_FROM_EMAIL=noreply@yourdomain.com

# Firebase Cloud Messaging (Push Notifications)
FCM_SERVER_KEY=<your-fcm-server-key>

# Cloudflare R2 (für Report Storage - optional)
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=<your-bucket-name>
```

**Health Check Konfiguration:**

- Health Check Path: `/api/health`
- Port: `8080`
- Timeout: `30s`

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

### Automatisches Deployment

Railway auto-deployed bei Git Push auf `main` Branch. Für erweiterte CI/CD nutze GitHub Actions:

### GitHub Actions Setup

**Vollständige CI/CD Pipeline:**

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm run lint

      - name: Run type check
        run: pnpm run type-check

      - name: Run unit tests
        run: pnpm run test:unit
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Run integration tests
        run: pnpm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm run build

      - name: Build Docker images
        run: |
          docker build -f dockerfiles/Dockerfile.web -t web:latest .
          docker build -f dockerfiles/Dockerfile.api -t api:latest .
          docker build -f dockerfiles/Dockerfile.worker -t worker:latest .

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy to Staging
        run: railway up --service staging --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Run database migrations
        run: railway run --service api npm run db:migrate
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Deploy to Production
        run: railway up --service production --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Preview Deployments

**Automatische Preview Deployments für Pull Requests:**

```yaml
# .github/workflows/preview-deploy.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]

jobs:
  deploy-preview:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Create Preview Environment
        run: |
          railway environment create --name "pr-${{ github.event.pull_request.number }}"
          railway link --environment "pr-${{ github.event.pull_request.number }}"
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Deploy Preview
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployment: ${{ secrets.RAILWAY_PREVIEW_URL }}'
            })

  cleanup-preview:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Delete Preview Environment
        run: |
          railway environment delete --name "pr-${{ github.event.pull_request.number }}" --yes
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Environment Management

**Drei Environments: Development, Staging, Production**

```bash
# Development Environment
railway environment create --name development
railway link --environment development

# Staging Environment
railway environment create --name staging
railway link --environment staging

# Production Environment
railway environment create --name production
railway link --environment production
```

**Environment-spezifische Variablen:**

```bash
# Development
railway variables set NODE_ENV=development --environment development
railway variables set LOG_LEVEL=debug --environment development

# Staging
railway variables set NODE_ENV=staging --environment staging
railway variables set LOG_LEVEL=info --environment staging

# Production
railway variables set NODE_ENV=production --environment production
railway variables set LOG_LEVEL=warn --environment production
```

### Deployment Hooks

**Pre-Deployment Hook (Database Migrations):**

```json
// railway.json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "dockerfiles/Dockerfile.api"
  },
  "deploy": {
    "startCommand": "npm run db:migrate && node dist/main.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## ✅ Post-Deployment Verification

Nach dem erfolgreichen Deployment alle 3 Services testen:

### 1. Web Service (Next.js)

```bash
# Browser öffnen
https://your-web-service.railway.app

# Erwartetes Ergebnis:
# ✅ Next.js App lädt
# ✅ Keine 500 Errors
# ✅ Assets werden geladen (CSS, JS, Images)
```

### 2. API Service (NestJS)

```bash
# Health Check testen
curl https://your-api-service.railway.app/api/health

# Erwartetes Ergebnis:
{
  "status": "ok",
  "timestamp": "2025-11-11T14:00:00.000Z",
  "app": "Planday Clone",
  "version": "1.0.0"
}

# Readiness Check
curl https://your-api-service.railway.app/api/health/ready

# Erwartetes Ergebnis:
{
  "status": "ready",
  "database": "connected",
  "redis": "connected"
}
```

### 3. Worker Service (BullMQ)

```bash
# Health Check testen
curl https://your-worker-service.railway.app/api/health

# Erwartetes Ergebnis:
{
  "status": "ok",
  "timestamp": "2025-11-11T14:00:00.000Z",
  "app": "Worker Service",
  "version": "1.0.0"
}

# Worker Logs in Railway Dashboard prüfen:
# Erwartete Log-Einträge:
# ✅ "EmailProcessorService: ✅ Email processor started"
# ✅ "NotificationProcessorService: ✅ Notification processor started"
# ✅ "ReportProcessorService: ✅ Report processor started"
# ✅ "All background workers started successfully"
```

### 4. Service-Verbindungen testen

```bash
# Von Web → API
# Im Browser DevTools → Network Tab
# API Calls sollten zu https://your-api-service.railway.app/api/* gehen

# Von API → PostgreSQL
# Logs prüfen auf "Database connected" ohne Errors

# Von API → Redis
# Logs prüfen auf "Redis connected" ohne Errors

# Von Worker → Redis
# Logs prüfen auf "Redis connected" und keine NOAUTH Errors

# Von Worker → PostgreSQL
# Logs prüfen auf "Database connected"
```

### 5. Automated Verification Script

```bash
# scripts/verify-deployment.sh
#!/bin/bash

WEB_URL="https://your-web-service.railway.app"
API_URL="https://your-api-service.railway.app"
WORKER_URL="https://your-worker-service.railway.app"

echo "🔍 Verifying deployment..."

# Test Web
if curl -f -s "$WEB_URL" > /dev/null; then
  echo "✅ Web Service: OK"
else
  echo "❌ Web Service: FAILED"
  exit 1
fi

# Test API
if curl -f -s "$API_URL/api/health" | grep -q "ok"; then
  echo "✅ API Service: OK"
else
  echo "❌ API Service: FAILED"
  exit 1
fi

# Test Worker
if curl -f -s "$WORKER_URL/api/health" | grep -q "ok"; then
  echo "✅ Worker Service: OK"
else
  echo "❌ Worker Service: FAILED"
  exit 1
fi

echo "🎉 All services are healthy!"
```

### Troubleshooting häufige Probleme

| Problem                                       | Lösung                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Worker: NOAUTH Authentication required**    | `REDIS_URL` muss Passwort enthalten: `redis://:password@host:port`                          |
| **API: Cannot find module '@planday/config'** | pnpm virtual store issue. Rebuild mit `pnpm install --frozen-lockfile --prod` im Dockerfile |
| **Web: 500 Internal Server Error**            | Check `NEXT_PUBLIC_API_URL` Environment Variable                                            |
| **All Services: Database connection failed**  | `DATABASE_URL` von PostgreSQL Plugin korrekt referenziert?                                  |

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

## 🏥 Health Checks

### Health Check Endpoints

**API Health Check (`/health`):**

```typescript
// apps/api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: DatabaseHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
    ]);
  }

  @Get('liveness')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
```

**Drizzle Database Health Indicator:**

```typescript
// apps/api/src/health/database.health.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { db } from '@planday/database';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      // Simple query to check database connection
      await db.execute('SELECT 1');
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false),
      );
    }
  }
}
```

**Next.js Health Check:**

```typescript
// apps/web/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

### Railway Health Check Configuration

**In railway.json:**

```json
{
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Via Railway Dashboard:**

1. Service → Settings → Health Check
2. Path: `/health`
3. Timeout: 100 seconds
4. Interval: 30 seconds

### Liveness vs Readiness

**Liveness Probe (`/health/liveness`):**

- Prüft ob Service läuft
- Einfache Antwort ohne externe Dependencies
- Railway restartet Service bei Fehler

**Readiness Probe (`/health/readiness`):**

- Prüft ob Service bereit für Traffic
- Prüft Database, Redis, etc.
- Railway stoppt Traffic-Routing bei Fehler

**Implementation:**

```typescript
@Get('liveness')
liveness() {
  // Simple check - service is alive
  return { status: 'ok' };
}

@Get('readiness')
async readiness() {
  // Check dependencies
  const checks = await Promise.allSettled([
    this.db.pingCheck('database'),
    this.redis.pingCheck('redis'),
  ]);

  const isReady = checks.every(check => check.status === 'fulfilled');

  if (!isReady) {
    throw new ServiceUnavailableException('Service not ready');
  }

  return { status: 'ready' };
}
```

### Health Check Monitoring

**Grafana Dashboard für Health Checks:**

```yaml
# prometheus/alerts.yml
groups:
  - name: health_checks
    rules:
      - alert: ServiceDown
        expr: up{job="api"} == 0
        for: 1m
        annotations:
          summary: 'Service is down'

      - alert: HealthCheckFailing
        expr: health_check_status{service="api"} == 0
        for: 2m
        annotations:
          summary: 'Health check is failing'

      - alert: DatabaseConnectionFailed
        expr: database_health_status == 0
        for: 1m
        annotations:
          summary: 'Database connection failed'
```

---

## 📊 Monitoring in Railway

### Railway Built-in Monitoring

Railway bietet Built-in Monitoring:

- ✅ CPU Usage
- ✅ Memory Usage
- ✅ Network Traffic
- ✅ Deployment Logs
- ✅ Custom Metrics

### Prometheus Metrics Setup

**NestJS Prometheus Integration:**

```bash
npm install @willsoto/nestjs-prometheus prom-client
```

```typescript
// apps/api/src/main.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
    }),
  ],
})
```

**Metrics Endpoint:**

```typescript
// apps/api/src/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Registry } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  constructor(private registry: Registry) {}

  @Get()
  async getMetrics() {
    return this.registry.metrics();
  }
}
```

**Custom Business Metrics:**

```typescript
// apps/api/src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  private shiftCreatedCounter = new Counter({
    name: 'shifts_created_total',
    help: 'Total number of shifts created',
    labelNames: ['organization_id'],
  });

  private emailSentHistogram = new Histogram({
    name: 'emails_sent_duration_seconds',
    help: 'Time to send email',
    labelNames: ['type'],
  });

  incrementShiftCreated(organizationId: string) {
    this.shiftCreatedCounter.inc({ organization_id: organizationId });
  }

  recordEmailSent(type: string, duration: number) {
    this.emailSentHistogram.observe({ type }, duration);
  }
}
```

### Grafana Setup auf Railway

**Grafana Service hinzufügen:**

```bash
# Add Grafana as separate service
railway add --name grafana
```

**Dockerfile für Grafana:**

```dockerfile
# dockerfiles/Dockerfile.grafana
FROM grafana/grafana:latest

COPY grafana/provisioning /etc/grafana/provisioning
COPY grafana/dashboards /var/lib/grafana/dashboards

ENV GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
ENV GF_SERVER_ROOT_URL=${GRAFANA_ROOT_URL}
```

**Grafana Configuration:**

```yaml
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

### Grafana Alerting Rules

**Alert Configuration:**

```yaml
# grafana/provisioning/alerting/alerts.yml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      - uid: high_error_rate
        title: High Error Rate
        condition: A
        data:
          - refId: A
            queryType: ''
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: prometheus
            model:
              expr: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.1'

      - uid: slow_response_time
        title: Slow Response Time
        condition: A
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: 'histogram_quantile(0.95, http_request_duration_seconds) > 1'

      - uid: high_memory_usage
        title: High Memory Usage
        condition: A
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: 'process_resident_memory_bytes / 1024 / 1024 > 500'
```

**Alert Notifications:**

```yaml
# Configure in Grafana UI or via API
# Channels: Email, Slack, PagerDuty, etc.
```

### Uptime Monitoring

**Externe Uptime Monitoring (Better Uptime / UptimeRobot):**

```typescript
// External service checks
// https://api.yourdomain.com/health
// Interval: 1 minute
// Alert: Email/Slack if down for 2 minutes
```

**Railway Status Page:**

```typescript
// apps/web/app/status/page.tsx
export default async function StatusPage() {
  const checks = await Promise.all([
    checkAPI(),
    checkDatabase(),
    checkRedis(),
  ]);

  return (
    <div>
      <h1>System Status</h1>
      {checks.map(check => (
        <div key={check.name}>
          {check.status === 'ok' ? '✅' : '❌'} {check.name}
        </div>
      ))}
    </div>
  );
}
```

### Log Aggregation

**Loki Setup (Log Aggregation):**

```dockerfile
# dockerfiles/Dockerfile.loki
FROM grafana/loki:latest

COPY loki-config.yml /etc/loki/local-config.yaml
```

**Log Shipping:**

```typescript
// apps/api/src/logger/loki-transport.ts
import { Transport } from 'winston-transport';
import { createLogger } from 'winston';

export class LokiTransport extends Transport {
  log(info: any, callback: () => void) {
    // Send logs to Loki
    fetch('http://loki:3100/loki/api/v1/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streams: [
          {
            labels: { service: 'api', level: info.level },
            entries: [
              {
                ts: new Date().toISOString(),
                line: JSON.stringify(info),
              },
            ],
          },
        ],
      }),
    });

    callback();
  }
}
```

**Grafana Logs Dashboard:**

```json
{
  "dashboard": {
    "title": "Application Logs",
    "panels": [
      {
        "title": "Error Logs",
        "targets": [
          {
            "expr": "{service=\"api\", level=\"error\"}"
          }
        ]
      }
    ]
  }
}
```

### Sentry Integration

**Error Tracking:**

```env
# In allen Services
SENTRY_DSN=<your-sentry-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Performance Monitoring:**

```typescript
// Sentry automatically tracks:
// - API response times
// - Database query performance
// - Frontend page load times
// - Error rates
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
