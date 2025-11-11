# Quick Start Guide - Local Development Setup

This guide will help you set up the Planday Clone project on your local machine in **30 minutes**.

---

## 📋 Prerequisites

### Required Software

```bash
# Node.js 22.x LTS (required)
node --version  # Should show v22.x.x

# pnpm (package manager)
pnpm --version  # Should show 9.x or higher

# PostgreSQL 17
psql --version  # Should show 17.x

# Redis 7.4
redis-cli --version  # Should show 7.4.x

# Git
git --version
```

### Installation Links

**macOS (Homebrew):**

```bash
# Node.js via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
nvm use 22

# pnpm
npm install -g pnpm@latest

# PostgreSQL & Redis
brew install postgresql@17 redis

# Start services
brew services start postgresql@17
brew services start redis
```

**Linux (Ubuntu/Debian):**

```bash
# Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
nvm use 22

# pnpm
npm install -g pnpm@latest

# PostgreSQL 17
sudo apt install curl ca-certificates
sudo install -d /usr/share/postgresql-common/pgdg
sudo curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
sudo sh -c 'echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
sudo apt update
sudo apt install postgresql-17

# Redis
sudo apt install redis-server

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server
```

**Windows:**

```powershell
# Use WSL2 (recommended) and follow Linux instructions
# Or install individually:
# - Node.js: https://nodejs.org/
# - pnpm: npm install -g pnpm
# - PostgreSQL: https://www.postgresql.org/download/windows/
# - Redis: https://github.com/microsoftarchive/redis/releases
```

---

## 🚀 Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/quantumshiftplanner.git
cd quantumshiftplanner
```

### 2. Create Workspace Structure

The project uses a monorepo structure with pnpm workspaces:

```bash
# Create workspace structure
mkdir -p apps/{web,api,worker}
mkdir -p packages/{database,types,config,ui}
mkdir -p dockerfiles
```

### 3. Initialize pnpm Workspace

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Create root `package.json`:

```json
{
  "name": "planday-clone",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev": "pnpm --parallel --filter \"./apps/**\" dev",
    "build": "pnpm --filter \"./packages/**\" build && pnpm --filter \"./apps/**\" build",
    "test": "pnpm --recursive test",
    "test:unit": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "type-check": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "clean": "pnpm --recursive exec rm -rf dist .next .turbo node_modules"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "@typescript-eslint/eslint-plugin": "^8.15.0",
    "@typescript-eslint/parser": "^8.15.0",
    "eslint": "^9.15.0",
    "prettier": "^3.3.3",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8",
    "@vitest/ui": "^2.1.8",
    "@playwright/test": "^1.49.0"
  }
}
```

### 4. Install Dependencies

```bash
pnpm install
```

---

## 🗄️ Database Setup

### 1. Create Development Database

```bash
# Connect to PostgreSQL
psql postgres

# In psql:
CREATE DATABASE planday_dev;
CREATE USER planday_user WITH PASSWORD 'your_local_password';
GRANT ALL PRIVILEGES ON DATABASE planday_dev TO planday_user;

# Exit psql
\q
```

### 2. Setup Database Package

```bash
# Create database package
cd packages/database

# package.json
cat > package.json << 'EOF'
{
  "name": "@planday/database",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "drizzle-orm": "^0.36.4",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "drizzle-kit": "^0.28.1",
    "typescript": "^5.7.2"
  }
}
EOF

# Install dependencies
pnpm install

cd ../..
```

### 3. Configure Drizzle

Create `drizzle.config.ts` in the root:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './packages/database/src/schema/index.ts',
  out: './packages/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### 4. Copy Database Schema

Copy the complete schema from `CONCEPT.md` into `packages/database/src/schema/index.ts`.

### 5. Generate and Run Migrations

```bash
# Generate migration
pnpm db:generate

# Run migration
pnpm db:migrate
```

---

## 🔐 External Services Setup

### 1. Clerk (Authentication)

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up / Sign in
3. Create new application: "Planday Clone Dev"
4. Enable Organizations:
   - Dashboard → Configure → Organizations → Enable
5. Get API keys:
   - Dashboard → API Keys
   - Copy Publishable Key & Secret Key

### 2. Maileroo (Email)

1. Go to [https://maileroo.com](https://maileroo.com)
2. Sign up / Sign in
3. Verify your dev email domain (or use test mode)
4. Get API Key:
   - Dashboard → API Keys → Create New Key
5. Get SMTP credentials (optional)

### 3. Cloudflare R2 (File Storage)

1. Go to [https://cloudflare.com](https://cloudflare.com)
2. Sign up / Sign in
3. Navigate to R2 Object Storage
4. Create bucket: "planday-dev"
5. Create API Token:
   - R2 → Manage R2 API Tokens → Create API Token
   - Permissions: Object Read & Write
   - Copy Access Key ID & Secret Access Key

### 4. Firebase (Push Notifications)

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create new project: "Planday Clone Dev"
3. Add Web App & Mobile Apps
4. Enable Cloud Messaging
5. Download service account key:
   - Project Settings → Service Accounts → Generate New Private Key
6. Copy Web Push certificate (for web notifications)

---

## ⚙️ Environment Variables

### 1. Create Environment Files

```bash
# Web App (.env.local in apps/web/)
cp apps/web/.env.example apps/web/.env.local

# API (.env in apps/api/)
cp apps/api/.env.example apps/api/.env

# Worker (.env in apps/worker/)
cp apps/worker/.env.example apps/worker/.env
```

### 2. Configure Environment Variables

**apps/web/.env.local:**

```env
# Database
DATABASE_URL=postgresql://planday_user:your_local_password@localhost:5432/planday_dev

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**apps/api/.env:**

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://planday_user:your_local_password@localhost:5432/planday_dev

# Redis
REDIS_URL=redis://localhost:6379

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# CORS
CORS_ORIGIN=http://localhost:3000

# JWT
JWT_SECRET=your-dev-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d

# Maileroo
MAILEROO_API_KEY=your-maileroo-key
EMAIL_FROM=dev@yourdomain.com

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=planday-dev
R2_PUBLIC_URL=https://planday-dev.your-r2-domain.com

# Firebase FCM
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**apps/worker/.env:**

```env
# Core
NODE_ENV=development
PORT=4001

# Database & Redis
DATABASE_URL=postgresql://planday_user:your_local_password@localhost:5432/planday_dev
REDIS_URL=redis://localhost:6379

# Clerk Authentication (for user sync in workers)
CLERK_SECRET_KEY=sk_test_... # From Clerk Dashboard
CLERK_PUBLISHABLE_KEY=pk_test_... # From Clerk Dashboard

# Maileroo Email Service
MAILEROO_API_KEY=your-maileroo-api-key
MAILEROO_FROM_EMAIL=dev@yourdomain.com

# Firebase Cloud Messaging (Push Notifications)
FCM_SERVER_KEY=your-fcm-server-key

# Cloudflare R2 Storage (for report files - optional)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=planday-dev
```

---

## 🏃 Running the Application

### Development Mode (All Services)

```bash
# Terminal 1: Start Web App (Next.js)
cd apps/web
pnpm dev
# Runs on http://localhost:3000

# Terminal 2: Start API (NestJS)
cd apps/api
pnpm dev
# Runs on http://localhost:3001

# Terminal 3: Start Worker (BullMQ Background Jobs)
cd apps/worker
pnpm dev
# Runs on http://localhost:4001
# ✅ Fully implemented mit 3 Job Processors:
#    - Email Queue (shift notifications, password resets)
#    - Notification Queue (push notifications via FCM)
#    - Report Queue (payroll, analytics reports)

# Terminal 4: Redis (if not running as service)
redis-server

# Terminal 5: PostgreSQL (if not running as service)
postgres -D /usr/local/var/postgresql@17

# Terminal 6: Drizzle Studio (Database UI)
pnpm db:studio
# Runs on http://localhost:4983
```

### Using Turborepo (Recommended)

Add `turbo.json` to root:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "type-check": {}
  }
}
```

Install Turborepo:

```bash
pnpm add -D turbo
```

Update root `package.json`:

```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "test": "turbo run test"
  }
}
```

Start all services:

```bash
pnpm dev
```

---

## 🧪 Testing Setup

### Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Watch mode
pnpm test:unit --watch

# With coverage
pnpm test:unit --coverage
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Specific test file
pnpm test:integration apps/api/src/shifts/shifts.integration.spec.ts
```

### E2E Tests

```bash
# Install Playwright browsers
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# UI mode
pnpm exec playwright test --ui

# Debug mode
pnpm exec playwright test --debug
```

---

## 🔧 Development Tools

### VS Code Extensions (Recommended)

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "Prisma.prisma",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Database Tools

**Drizzle Studio:**

```bash
pnpm db:studio
# Access at http://localhost:4983
```

**pgAdmin (Optional):**

```bash
# macOS
brew install --cask pgadmin4

# Linux
sudo apt install pgadmin4

# Connect to localhost:5432
```

**Redis Commander (Optional):**

```bash
npm install -g redis-commander
redis-commander
# Access at http://localhost:8081
```

---

## 📱 Mobile Development

### React Native Setup

```bash
# Install Expo CLI
npm install -g expo-cli

# Navigate to mobile app
cd apps/mobile

# Install dependencies
pnpm install

# Start development server
pnpm start

# Run on iOS simulator (macOS only)
pnpm ios

# Run on Android emulator
pnpm android
```

### iOS Setup (macOS only)

```bash
# Install Xcode from App Store
# Install CocoaPods
sudo gem install cocoapods

# Install pods
cd apps/mobile/ios
pod install
cd ..
```

### Android Setup

1. Install Android Studio
2. Install Android SDK (API 34+)
3. Set ANDROID_HOME environment variable:

```bash
# Add to ~/.zshrc or ~/.bashrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## 🚦 Verify Setup

### Health Checks

```bash
# Check Web App
curl http://localhost:3000/api/health

# Check API
curl http://localhost:3001/health

# Check Database
psql postgresql://planday_user:your_local_password@localhost:5432/planday_dev -c "SELECT version();"

# Check Redis
redis-cli ping
```

### Seed Test Data

```bash
# Run seed script
pnpm db:seed

# Or manually via Drizzle Studio
pnpm db:studio
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -ti:3000  # For port 3000
lsof -ti:3001  # For port 3001

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -U planday_user -d planday_dev -h localhost

# Reset database
dropdb planday_dev
createdb planday_dev
pnpm db:migrate
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# Restart Redis
brew services restart redis  # macOS
sudo systemctl restart redis-server  # Linux
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
pnpm clean
pnpm install

# Clear pnpm cache
pnpm store prune
```

### TypeScript Errors

```bash
# Rebuild all packages
pnpm build

# Check types
pnpm type-check
```

---

## 📚 Next Steps

1. ✅ Read [CONCEPT.md](./CONCEPT.md) for architecture details
2. ✅ Read [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow
3. ✅ Read [API_REFERENCE.md](./API_REFERENCE.md) for API documentation
4. ✅ Join our Discord/Slack for support
5. ✅ Start building features!

---

## 🤝 Getting Help

- **Documentation**: Check [README.md](./README.md) for quick links
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Ask questions on GitHub Discussions
- **Discord**: Join our development Discord server

---

**Setup Time:** ~30 minutes
**Last Updated:** November 2025
**Maintained by:** Development Team

Happy coding! 🚀
