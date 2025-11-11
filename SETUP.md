# Setup Guide

Quick setup guide for local development.

## Prerequisites

- Node.js 22.x LTS
- pnpm 9.x
- PostgreSQL 17
- Redis 7.4
- Docker (optional, for containerized development)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

```bash
# Copy environment templates
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env

# Edit .env files with your actual credentials
```

### 3. Start Database Services

**Option A: Using Docker Compose**

```bash
docker-compose up -d postgres redis
```

**Option B: Local Installation**

```bash
# macOS
brew services start postgresql@17
brew services start redis

# Linux
sudo systemctl start postgresql
sudo systemctl start redis-server
```

### 4. Run Database Migrations

```bash
pnpm db:push
```

### 5. Start Development Servers

```bash
# Start all services
pnpm dev

# Or start individually
pnpm --filter @planday/web dev    # http://localhost:3000
pnpm --filter @planday/api dev    # http://localhost:4000
```

## Access Points

- **Web App**: http://localhost:3000
- **API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs
- **Health Check**: http://localhost:4000/api/health
- **Drizzle Studio**: Run `pnpm db:studio` → http://localhost:4983

## Project Structure

```
quantumshiftplanner/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   ├── api/          # NestJS 10 backend
│   └── worker/       # Background job processor
├── packages/
│   ├── database/     # Drizzle ORM & schemas
│   ├── types/        # Shared TypeScript types
│   ├── config/       # Shared configuration
│   └── ui/           # Shared UI components
├── dockerfiles/      # Docker configurations
└── pnpm-workspace.yaml
```

## Common Commands

### Development
- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages and apps
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all code
- `pnpm format` - Format all code with Prettier

### Database
- `pnpm db:push` - Push schema changes to database
- `pnpm db:generate` - Generate migrations from schema
- `pnpm db:migrate` - Run pending migrations
- `pnpm db:studio` - Open Drizzle Studio GUI

### Cleaning
- `pnpm clean` - Remove all node_modules and build artifacts
- `pnpm clean:build` - Remove only build artifacts

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Next Steps

1. Read [CLAUDE.md](./CLAUDE.md) for development guidelines
2. Check [CONCEPT.md](./CONCEPT.md) for architecture details
3. Review [API_REFERENCE.md](./API_REFERENCE.md) for API documentation
4. See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution workflow
