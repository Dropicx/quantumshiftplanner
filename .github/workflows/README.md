# GitHub Actions CI/CD Configuration

This directory contains GitHub Actions workflows for continuous integration and deployment.

## 📋 Workflows

### `ci.yml` - Continuous Integration

Runs on every push and pull request to `main` and `develop` branches.

**What it does:**
1. **Quality Checks** - Type checking, linting, and code formatting verification
2. **Tests** - Unit and integration tests with PostgreSQL and Redis
3. **Build Verification** - Ensures all packages and apps build successfully

**Jobs:**

#### 1. Quality Checks (`quality-checks`)
- ✅ TypeScript type checking (`pnpm type-check`)
- ✅ ESLint linting (`pnpm lint`)
- ✅ Prettier format check (`pnpm format:check`)
- **Duration:** ~2-3 minutes

#### 2. Run Tests (`test`)
- ✅ Spins up PostgreSQL 17 and Redis 7.4 containers
- ✅ Runs database migrations
- ✅ Executes unit tests (`pnpm test:unit`)
- ✅ Executes integration tests (`pnpm test:integration`)
- **Duration:** ~4-5 minutes

#### 3. Build Verification (`build-check`)
- ✅ Builds all shared packages (`packages/*`)
- ✅ Builds web app (`apps/web`)
- ✅ Builds API service (`apps/api`)
- ✅ Verifies build artifacts exist
- **Duration:** ~5-7 minutes

#### 4. CI Success (`ci-success`)
- ✅ Summarizes all job results
- ✅ Fails if any job fails
- ✅ Required status check for branch protection

**Total Pipeline Duration:** ~10-15 minutes

---

## 🚀 Railway Deployment Strategy

**Railway handles deployments automatically** - GitHub Actions only runs quality checks.

### How It Works:

1. **Developer pushes code** to GitHub (`main` or `develop` branch)
2. **GitHub Actions runs CI pipeline** (testing, linting, building)
3. **Railway watches GitHub repository** and triggers deployment automatically
4. **Railway builds and deploys** using Dockerfiles in `dockerfiles/`

### Railway Auto-Deploy Configuration:

#### **Web Service:**
- **Watch Branch:** `main`
- **Root Directory:** `/`
- **Dockerfile:** `dockerfiles/Dockerfile.web`
- **Trigger:** Automatic on push to `main`
- **Build Time:** ~3-5 minutes

#### **API Service:**
- **Watch Branch:** `main`
- **Root Directory:** `/`
- **Dockerfile:** `dockerfiles/Dockerfile.api`
- **Trigger:** Automatic on push to `main`
- **Build Time:** ~4-6 minutes

### Deployment Flow:

```
┌─────────────────┐
│  Developer Push │
└────────┬────────┘
         │
         ├───────────────────────────────────┐
         │                                   │
         v                                   v
┌────────────────────┐           ┌──────────────────┐
│  GitHub Actions CI │           │  Railway Watches │
│                    │           │  GitHub Repo     │
│  • Type Check      │           └─────────┬────────┘
│  • Lint            │                     │
│  • Test            │                     v
│  • Build Check     │           ┌──────────────────┐
└────────┬───────────┘           │ Railway Builds   │
         │                       │ • Docker Build   │
         │                       │ • Run Migrations │
         │                       │ • Deploy         │
         │                       └─────────┬────────┘
         │                                 │
         v                                 v
    ✅ CI Pass                       🚀 Deployed
         │                                 │
         └─────────────┬───────────────────┘
                       │
                       v
                 💚 Production
```

---

## 🔧 Configuration

### Environment Variables (GitHub Actions)

The CI workflow uses these environment variables (set in the workflow file):

```yaml
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/planday_test
REDIS_URL: redis://localhost:6379
NODE_ENV: test
CLERK_SECRET_KEY: sk_test_mock_key_for_ci
CLERK_PUBLISHABLE_KEY: pk_test_mock_key_for_ci
```

**Note:** These are mock values for CI testing only. Real credentials are configured in Railway.

### Railway Environment Variables

Configure these in Railway dashboard for each service:

**Web Service:**
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-url.up.railway.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

**API Service:**
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

---

## 📊 Performance & Caching

### GitHub Actions Caching

The workflow uses `pnpm` store caching to speed up installations:

```yaml
- uses: actions/cache@v4
  with:
    path: ${{ env.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
```

**Benefits:**
- ⚡ ~2-3 minutes faster dependency installation
- 💰 Reduced GitHub Actions usage
- 🔄 Cache invalidates when `pnpm-lock.yaml` changes

### Railway Build Caching

Railway automatically caches Docker layers:
- Base image layers (`node:22-alpine`)
- Dependency layers (when `pnpm-lock.yaml` unchanged)
- Built packages (when source unchanged)

**Build Time Savings:**
- First build: ~5-7 minutes
- Cached build: ~1-3 minutes

---

## 🔒 Security Best Practices

### Secrets Management

❌ **Never commit secrets to the repository!**

**For GitHub Actions:**
- Mock/test credentials are hardcoded in workflow (safe for public repos)
- Real credentials managed by Railway

**For Railway:**
- Environment variables stored securely in Railway dashboard
- Use Railway's variable references: `${{Postgres.DATABASE_URL}}`
- Production secrets separate from development

### Branch Protection

Recommended GitHub branch protection rules for `main`:

```yaml
- Require pull request reviews (1 approver)
- Require status checks to pass (ci-success job)
- Require branches to be up to date
- Require signed commits (optional)
```

---

## 🐛 Troubleshooting

### CI Pipeline Fails

**Type Check Errors:**
```bash
# Run locally to reproduce
pnpm type-check
```

**Lint Errors:**
```bash
# Run locally to reproduce
pnpm lint

# Auto-fix
pnpm lint:fix
```

**Test Failures:**
```bash
# Run tests locally with Docker
docker-compose up -d postgres redis
pnpm test:unit
pnpm test:integration
```

**Build Failures:**
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Railway Deployment Fails

**Check Railway Logs:**
```bash
railway logs --service web
railway logs --service api
```

**Common Issues:**
- Missing environment variables → Check Railway dashboard
- Database connection errors → Verify `DATABASE_URL`
- Build errors → Check Dockerfile paths and dependencies

---

## 🚀 Future Enhancements

When you're ready to build Docker images via GitHub Actions instead of Railway:

1. **Add Container Registry:**
   - GitHub Container Registry (ghcr.io)
   - Docker Hub
   - AWS ECR

2. **Update Workflow:**
   - Add Docker build/push steps
   - Tag images with commit SHA
   - Push to container registry

3. **Update Railway:**
   - Change source from GitHub to Docker image
   - Reference image from registry
   - Deploy pre-built images

**Benefits:**
- Faster Railway deployments (no build step)
- Consistent builds across environments
- Better rollback capabilities
- Build once, deploy many times

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Documentation](https://docs.railway.app)
- [pnpm Monorepo Guide](https://pnpm.io/workspaces)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
