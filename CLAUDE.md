# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Planday Clone** - A complete Workforce Management System (WMS) designed as an alternative to Planday, targeting SMBs with 10-500 employees in shift-based industries. The project uses a hybrid approach combining proven SaaS tools (Clerk for auth, Maileroo for email) with open-source infrastructure for optimal cost-effectiveness.

**Status**: Planning/Documentation phase - codebase structure to be implemented according to documented architecture.

## Tech Stack

### Frontend Web

- **Next.js 15** (App Router, React Server Components)
- **React 19** with TypeScript 5.7
- **Tailwind CSS 4.0** + shadcn/ui
- **TanStack Query v5** for data fetching
- **Zustand 5.x** for state management
- **@fullcalendar/react 6.x** for scheduling UI
- **@dnd-kit/core** for drag-and-drop

### Mobile Apps

- **React Native 0.76.x** with Expo SDK 52
- **Expo Router** for file-based routing
- Native features: expo-location (GPS), expo-camera (check-in photos), expo-notifications (push)
- **react-native-firebase** for FCM push notifications

### Backend API

- **NestJS 10.x** with Fastify
- **TypeScript 5.7** on Node.js 22.x LTS
- **Drizzle ORM** for database access (type-safe)
- **BullMQ 5.x** for job queues
- Testing: Vitest (unit/integration), Playwright (E2E)

### Infrastructure

- **PostgreSQL 17** (primary database)
- **Redis 7.4** (caching, sessions, job queue)
- **Clerk** (authentication, organizations, payments)
- **Maileroo** (email delivery)
- **Cloudflare R2** (file storage)
- **Firebase FCM** (push notifications)
- **Railway** (hosting platform)

### Monitoring

- Prometheus (metrics)
- Grafana (dashboards)
- Loki (logs)
- Sentry (error tracking)

## Monorepo Structure

This project uses **pnpm workspaces** in a monorepo architecture:

```
quantumshiftplanner/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   ├── api/          # NestJS backend API (port 4000)
│   └── worker/       # NestJS background workers
├── packages/
│   ├── database/     # Drizzle ORM schemas and migrations
│   ├── types/        # Shared TypeScript types
│   ├── config/       # Shared configuration
│   └── ui/           # Shared UI components
├── dockerfiles/      # Docker configs for Railway deployment
└── pnpm-workspace.yaml
```

## Development Commands

### Initial Setup

```bash
# Install all dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local  # Edit with your Clerk/Maileroo keys

# Initialize database schema
pnpm db:push

# Run database migrations
pnpm db:migrate
```

### Development

```bash
# Start all services in parallel (web + api + worker)
pnpm dev

# Start specific service only
pnpm --filter @planday/web dev      # Web only (Next.js)
pnpm --filter @planday/api dev      # API only (NestJS)
pnpm --filter @planday/worker dev   # Worker only

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Testing

```bash
# Run all tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests with Playwright
pnpm test:e2e

# Watch mode for development
pnpm test:unit --watch
```

### Code Quality

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting without modifying files
pnpm format:check

# Run all quality checks before commit
pnpm type-check && pnpm lint && pnpm test:unit
```

**Pre-commit Hooks**: This project uses Husky and lint-staged to automatically run linting and formatting checks on staged files before each commit. This ensures code quality without needing to remember manual checks. The hooks will:

- Run ESLint with auto-fix on staged TypeScript files
- Run Prettier to format all staged files
- Only process files you're actually committing (fast!)

The hooks are automatically installed when you run `pnpm install` via the `prepare` script.

### Database Management

```bash
# Generate migrations from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (development only)
pnpm db:push

# Open Drizzle Studio on http://localhost:4983
pnpm db:studio
```

### Build & Deploy

```bash
# Build all packages and apps
pnpm build

# Clean all build artifacts
pnpm clean

# Build specific app
pnpm --filter @planday/web build
pnpm --filter @planday/api build
```

## Architecture Patterns

### Service Architecture

The system follows a **microservices-inspired monorepo** pattern:

1. **Web App (BFF)**: Next.js app serving UI and acting as Backend-for-Frontend
2. **API Service**: NestJS REST API with GraphQL endpoint and WebSocket support
3. **Worker Service**: Background job processor using BullMQ for async tasks (emails, reports, scheduled jobs)

### Authentication Flow

- **Clerk** handles all authentication (email/password, OAuth, SSO, MFA)
- Clerk provides JWT tokens that are verified by the NestJS API
- Web: Uses `@clerk/nextjs` middleware for route protection
- API: Uses JWT verification guards on protected routes
- Mobile: Uses `@clerk/clerk-expo` with deep linking for OAuth flows
- **User sync**: Clerk webhooks (`/api/webhooks/clerk`) sync user data to PostgreSQL with `clerkUserId` as primary identifier

### Database Schema

Key tables (see CONCEPT.md for full schema):

- `users` - synced from Clerk via webhooks (stores `clerkUserId`)
- `organizations` - multi-tenancy support
- `employees` - workforce members
- `shifts` - scheduled work shifts
- `shift_swaps` - shift exchange requests
- `time_entries` - clock-in/out records
- `availability` - employee availability windows
- `leave_requests` - vacation/sick leave

### Multi-Tenancy

- Clerk Organizations provide the tenant isolation layer
- All database queries automatically filtered by `organizationId`
- Row-Level Security (RLS) in PostgreSQL enforces data isolation
- Each organization has its own subscription plan via Clerk Payments

### Real-time Features

- **Socket.io** for WebSocket connections (shift updates, messaging)
- Redis Pub/Sub for broadcasting events across service instances
- Real-time notifications for shift changes, swap requests, and messages

### Background Jobs

BullMQ job types (handled by worker service):

- Email notifications (via Maileroo)
- Report generation (payroll, analytics)
- Data cleanup and archival
- Scheduled notifications
- Webhook retries

## Key Integration Points

### Clerk Integration

- User authentication and session management
- Organization (tenant) management
- Subscription billing via Stripe (managed by Clerk)
- Webhooks for user sync: `POST /api/webhooks/clerk`

### Maileroo Integration

- Transactional emails (shift notifications, password resets)
- Marketing emails (announcements, updates)
- Template-based email system
- Webhook handling for bounce/delivery tracking

### Firebase FCM

- Push notifications for mobile apps
- Handled in worker service via background jobs
- Token storage in Redis with user association

## Testing Strategy

### Unit Tests (Vitest)

- Test individual functions and components
- Target: ≥80% code coverage
- Mock external dependencies (Clerk, Maileroo, Redis)

### Integration Tests (Vitest)

- Test API endpoints with real database (test DB)
- Test background job processing
- Target: ≥70% coverage of critical paths

### E2E Tests (Playwright)

- Test complete user workflows (login, shift creation, swap)
- Test across browsers (Chrome, Firefox, Safari)
- Run against staging environment

## Important Conventions

### File Naming

- React components: `PascalCase.tsx` (e.g., `ShiftCalendar.tsx`)
- Utilities/hooks: `camelCase.ts` (e.g., `useAuth.ts`)
- API routes: `kebab-case.ts` (e.g., `shift-swaps.controller.ts`)

### Commit Messages

Follow Conventional Commits:

```
feat(shifts): add drag-and-drop shift assignment
fix(auth): resolve Clerk webhook signature verification
docs(api): update API reference for shift endpoints
test(shifts): add E2E test for shift swap flow
```

### Environment Variables

- Never commit `.env` files
- Document all required vars in `.env.example`
- Clerk keys prefixed: `NEXT_PUBLIC_CLERK_*` (client) or `CLERK_*` (server)
- API keys for Maileroo, R2, etc. are server-only (no `NEXT_PUBLIC_`)

## Documentation References

The project includes comprehensive documentation:

- **[CONCEPT.md](./CONCEPT.md)** - Complete technical specification, database schema, tech stack details
- **[QUICK_START.md](./QUICK_START.md)** - Local development setup guide
- **[RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)** - Production deployment on Railway
- **[AUTH_FLOW.md](./AUTH_FLOW.md)** - Clerk authentication implementation details
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete REST API documentation
- **[MICROSERVICES_ARCHITECTURE.md](./MICROSERVICES_ARCHITECTURE.md)** - Service design and communication patterns
- **[MOBILE_ARCHITECTURE.md](./MOBILE_ARCHITECTURE.md)** - React Native app architecture
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Developer onboarding and workflow
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[SECURITY.md](./SECURITY.md)** - Security policy and vulnerability reporting

When implementing features, always reference the relevant documentation for design decisions and patterns.

## Security Considerations

- All API routes require authentication (JWT from Clerk)
- Rate limiting enforced at API gateway level
- SQL injection prevention via parameterized queries (Drizzle ORM)
- XSS protection via React's built-in escaping
- CSRF protection via SameSite cookies
- Secrets managed via environment variables (Railway secrets)
- Audit logging for sensitive operations (user management, shift changes)
- GDPR compliance: data export/deletion endpoints

## Common Workflows

### Adding a New Feature

1. Read relevant documentation (CONCEPT.md, API_REFERENCE.md)
2. Create feature branch: `git checkout -b feature/your-feature`
3. Implement in appropriate workspace (apps/web, apps/api, etc.)
4. Add unit tests for business logic
5. Update API documentation if adding endpoints
6. Test locally: `pnpm dev` and verify functionality
7. Run quality checks: `pnpm type-check && pnpm lint && pnpm test:unit`
8. Create PR with clear description

### Database Schema Changes

1. Modify schema in `packages/database/schema/`
2. Generate migration: `pnpm db:generate`
3. Review generated SQL in `packages/database/migrations/`
4. Apply migration: `pnpm db:migrate`
5. Update TypeScript types if needed
6. Update documentation (CONCEPT.md schema section)

### Debugging Issues

1. Check logs: `pnpm dev` shows all service logs
2. Inspect database: `pnpm db:studio` for visual DB browser
3. Check Redis: `redis-cli` for cache/session debugging
4. Review Clerk Dashboard for auth issues
5. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues

## Cost Optimization

The hybrid SaaS + open-source approach targets **~€100/month for 1000 users**:

- Clerk: $45/month (auth + organizations)
- Maileroo: $9/month (email delivery)
- Railway: $50/month (hosting PostgreSQL, Redis, services)
- Cloudflare R2: $1/month (file storage)
- Monitoring (self-hosted): $5/month

Compare to full-SaaS alternatives at ~€1,200/month (saving €13,200/year).

## Language Note

Documentation is primarily in German (target market), but code (comments, variables, functions) should be in English for international developer accessibility.
