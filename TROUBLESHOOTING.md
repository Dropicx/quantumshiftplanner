# Troubleshooting Guide

Common issues and their solutions for Planday Clone development and deployment.

---

## 📋 Table of Contents

- [Development Issues](#development-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [API Issues](#api-issues)
- [Build & Deployment Issues](#build--deployment-issues)
- [Logging & Debugging](#logging--debugging)
- [Performance Issues](#performance-issues)
- [Mobile App Issues](#mobile-app-issues)

---

## 🔧 Development Issues

### Port Already in Use

**Problem:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

```bash
# Find process using the port
lsof -ti:3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in .env
PORT=3002
```

### Module Not Found

**Problem:**

```
Error: Cannot find module '@planday/database'
```

**Solution:**

```bash
# 1. Clean install
pnpm clean
pnpm install

# 2. Build shared packages
pnpm --filter "@planday/database" build
pnpm --filter "@planday/types" build

# 3. Clear pnpm cache
pnpm store prune

# 4. Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

### TypeScript Errors After Update

**Problem:**

```
Type 'X' is not assignable to type 'Y'
```

**Solution:**

```bash
# 1. Rebuild all packages
pnpm build

# 2. Delete node_modules and reinstall
pnpm clean
pnpm install

# 3. Update TypeScript
pnpm add -D typescript@latest

# 4. Check tsconfig.json is correct
cat tsconfig.json
```

### Hot Reload Not Working

**Problem:** Changes don't reflect in browser

**Solution:**

```bash
# 1. Check .next cache
rm -rf apps/web/.next
rm -rf apps/web/.turbo

# 2. Restart dev server
pnpm dev

# 3. Check file watchers (Linux)
cat /proc/sys/fs/inotify/max_user_watches
# Increase if < 524288
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# 4. Disable Fast Refresh (last resort)
# In next.config.ts
reactStrictMode: false
```

### Environment Variables Not Loading

**Problem:** `process.env.VARIABLE` is undefined

**Solution:**

```bash
# 1. Check file name
# Next.js: .env.local (not .env)
# NestJS: .env

# 2. Prefix for public vars in Next.js
NEXT_PUBLIC_API_URL=...  # ✅ Available in browser
API_URL=...              # ❌ Server-only

# 3. Restart dev server after changes
# Ctrl+C then pnpm dev

# 4. Check .env is gitignored
cat .gitignore | grep .env
```

---

## 🗄️ Database Issues

### Connection Refused

**Problem:**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**

```bash
# 1. Check PostgreSQL is running
pg_isready

# 2. Start PostgreSQL
# macOS
brew services start postgresql@17

# Linux
sudo systemctl start postgresql

# Windows
net start postgresql-x64-17

# 3. Check DATABASE_URL
echo $DATABASE_URL

# 4. Test connection
psql postgresql://user:password@localhost:5432/dbname
```

### Migration Fails

**Problem:**

```
Error: relation "users" already exists
```

**Solution:**

```bash
# 1. Check current migrations
pnpm db:studio

# 2. Reset database (CAUTION: deletes all data!)
dropdb planday_dev
createdb planday_dev
pnpm db:migrate

# 3. Or manually fix migration
psql planday_dev
DROP TABLE IF EXISTS users CASCADE;
\q
pnpm db:migrate

# 4. Check migration history
SELECT * FROM drizzle_migrations;
```

### Slow Queries

**Problem:** Queries take > 1 second

**Solution:**

```sql
-- 1. Check query explain
EXPLAIN ANALYZE
SELECT * FROM shifts WHERE employee_id = 'xxx';

-- 2. Add missing indexes
CREATE INDEX idx_shifts_employee ON shifts(employee_id);
CREATE INDEX idx_shifts_date ON shifts(start_time);

-- 3. Analyze table statistics
ANALYZE shifts;

-- 4. Check for table bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public';
```

### Too Many Connections

**Problem:**

```
Error: sorry, too many clients already
```

**Solution:**

```typescript
// 1. Use connection pooling
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(DATABASE_URL, { max: 10 }); // Limit connections
const db = drizzle(client);

// 2. Close connections properly
await client.end();

// 3. Increase PostgreSQL max_connections
// Edit postgresql.conf
max_connections = 200

// Restart PostgreSQL
brew services restart postgresql@17
```

---

## 🔐 Authentication Issues

### Clerk Token Expired

**Problem:**

```
Error: Invalid token
```

**Solution:**

```typescript
// Frontend: Force token refresh
const { getToken } = useAuth();
const token = await getToken({ skipCache: true });

// Backend: Check token expiration
const payload = await verifyToken(token);
console.log('Expires:', new Date(payload.exp * 1000));

// Clerk tokens auto-refresh, but can manually refresh
await clerkClient.sessions.getToken(sessionId, 'your-template');
```

### Infinite Redirect Loop

**Problem:** Redirects between /sign-in and /dashboard

**Solution:**

```typescript
// 1. Check middleware config
// middleware.ts
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',  // ✅ Include sign-in
  '/sign-up(.*)',
]);

// 2. Check after-sign-in URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard  // Not /sign-in!

// 3. Clear cookies
// DevTools → Application → Cookies → Clear All

// 4. Check organization requirement
const { userId, orgId } = await auth();
if (!orgId) {
  return redirect('/onboarding');  // Not /sign-in
}
```

### Webhook Not Receiving Events

**Problem:** Clerk webhooks not triggering

**Solution:**

```bash
# 1. Check webhook URL is accessible
curl https://your-api.com/webhooks/clerk

# 2. Use ngrok for local development
ngrok http 3001
# Update Clerk webhook URL to ngrok URL

# 3. Check webhook secret
echo $CLERK_WEBHOOK_SECRET

# 4. Test webhook signature
# Check svix headers in request

# 5. Check Clerk webhook logs
# Clerk Dashboard → Webhooks → View Attempts
```

### Session Not Persisting

**Problem:** User logged out after page refresh

**Solution:**

```typescript
// 1. Check tokenCache (mobile)
import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();
console.log(storage.getAllKeys());

// 2. Check cookies (web)
// DevTools → Application → Cookies
// Look for __clerk_db_jwt

// 3. Check SameSite cookie policy
// next.config.ts
async headers() {
  return [{
    headers: [
      {
        key: 'Set-Cookie',
        value: 'SameSite=Lax'
      }
    ]
  }];
}

// 4. Verify HTTPS in production
// Clerk requires HTTPS for cookies
```

---

## 🔌 API Issues

### CORS Error

**Problem:**

```
Access to fetch blocked by CORS policy
```

**Solution:**

```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://your-domain.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Check frontend URL
NEXT_PUBLIC_API_URL=http://localhost:3001  // Must match backend
```

### 401 Unauthorized

**Problem:** API returns 401 even with valid token

**Solution:**

```typescript
// 1. Check token is sent
console.log(await getToken());

// 2. Check Authorization header format
headers: {
  Authorization: `Bearer ${token}`,  // ✅ "Bearer " prefix
}

// 3. Verify token on backend
const payload = await verifyToken(token, {
  secretKey: process.env.CLERK_SECRET_KEY,
});
console.log('User ID:', payload.sub);

// 4. Check guard is configured
@UseGuards(ClerkAuthGuard)  // Must be applied

// 5. Check public routes
@Public()  // If route should be public
```

### Rate Limit Exceeded

**Problem:**

```
Error: Too Many Requests (429)
```

**Solution:**

```typescript
// 1. Check current limits
// apps/api/src/main.ts
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: 100,
}]);

// 2. Increase limits temporarily
limit: 1000,  // For development

// 3. Use different throttle for dev
const isDevelopment = process.env.NODE_ENV === 'development';
limit: isDevelopment ? 10000 : 100,

// 4. Implement user-based throttling
// Custom throttle guard based on user ID
```

---

## 🚀 Build & Deployment Issues

### Build Fails on Railway

**Problem:** Build succeeds locally but fails on Railway

**Solution:**

```dockerfile
# 1. Check Node version matches
FROM node:22-alpine

# 2. Increase build memory
# Railway Dashboard → Settings → Memory: 2GB

# 3. Check environment variables
railway variables

# 4. Check Dockerfile path
# Railway Dashboard → Settings → Docker File Path
dockerfiles/Dockerfile.web

# 5. Build locally with same Dockerfile
docker build -f dockerfiles/Dockerfile.web .
```

### Next.js Build Out of Memory

**Problem:**

```
FATAL ERROR: Reached heap limit
```

**Solution:**

```json
// package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}

// Or in Railway
# Settings → Environment Variables
NODE_OPTIONS=--max-old-space-size=4096
```

### Database Migration Fails in Production

**Problem:** Migration works locally but fails in prod

**Solution:**

```bash
# 1. Check DATABASE_URL
railway variables | grep DATABASE_URL

# 2. Run migration manually
railway run npm run db:migrate

# 3. Check PostgreSQL version
# Local vs Production must match
psql $DATABASE_URL -c "SELECT version();"

# 4. Test migration on staging first
railway environment -e staging
railway run npm run db:migrate
```

### Static Files Not Found (404)

**Problem:** Images/fonts return 404

**Solution:**

```typescript
// 1. Use Next.js Image component
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={200} height={50} />

// 2. Check public directory
apps/web/public/logo.png  # ✅ Correct path

// 3. Reference without /public
src="/logo.png"  # ✅ Not /public/logo.png

// 4. For external images
// next.config.ts
images: {
  domains: ['cdn.example.com'],
}
```

---

## 📊 Logging & Debugging

### Accessing Logs

**Development:**

```bash
# Logs are printed to console/terminal
pnpm --filter @planday/api dev

# Look for correlation IDs in logs
# Example: [HTTP][abc-123-def] Incoming request
```

**Production (Railway):**

```bash
# View API logs
railway logs -s api

# View worker logs
railway logs -s worker

# Follow logs in real-time
railway logs -s api --follow

# Search for specific correlation ID
railway logs -s api | grep "abc-123-def"
```

**Log Files (Production):**

- **Location**: `logs/` directory in API service container
- **Error logs**: `logs/error-YYYY-MM-DD.log`
- **Combined logs**: `logs/combined-YYYY-MM-DD.log`
- **Retention**: 14 days, auto-rotated daily

### No Logs Appearing

**Problem:** Logger not showing any output

**Solution:**

```typescript
// 1. Check logger is injected
import { AppLoggerService } from '@/common/logger/logger.service';

export class MyService {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext('MyService'); // ✅ Set context
  }
}

// 2. Check log level
// .env
LOG_LEVEL=debug  # For development

// 3. Check logger module is imported
// app.module.ts
@Module({
  imports: [LoggerModule], // ✅ Must be imported
})
```

### Tracking Requests with Correlation IDs

**Problem:** Need to trace a specific request across services

**Solution:**

```typescript
// 1. Frontend: Include correlation ID in request
const correlationId = crypto.randomUUID();
const response = await fetch('/api/shifts', {
  headers: {
    'X-Correlation-ID': correlationId,
  },
});

// 2. Search logs for that correlation ID
grep "abc-123-def" logs/combined-2025-11-11.log

// 3. Or in Railway
railway logs -s api | grep "abc-123-def"
```

**Log output will show:**

```json
{
  "level": "info",
  "correlationId": "abc-123-def",
  "message": "Incoming request",
  "method": "GET",
  "url": "/api/shifts"
}
```

### Health Check Failures

**Problem:** Health checks returning errors

**Solution:**

```bash
# 1. Check health endpoint manually
curl https://your-api.railway.app/health
curl https://your-api.railway.app/health/ready

# 2. Check database connection
# Should show "database": { "status": "up" }

# 3. Check Redis connection
# Should show "redis": { "status": "up" }

# 4. View detailed logs
railway logs -s api --follow

# 5. Common issues:
# - DATABASE_URL incorrect
# - REDIS_URL incorrect
# - Database not started
# - Redis out of memory
```

### Debugging API Errors

**Problem:** API returning 500 errors

**Solution:**

```bash
# 1. Check logs for stack traces
railway logs -s api | grep "error"

# 2. Look for correlation ID in error response
# Frontend:
console.log(response.headers.get('X-Correlation-ID'));

# 3. Search logs by correlation ID
railway logs -s api | grep "correlation-id-here"

# 4. Enable debug logging (development)
LOG_LEVEL=debug pnpm dev

# 5. Check common issues:
# - Database query syntax errors
# - Missing environment variables
# - Invalid JWT tokens
# - Rate limiting triggered
```

### Log File Rotation Issues

**Problem:** Log files not rotating or growing too large

**Solution:**

```bash
# 1. Check rotation settings in logger.service.ts
# Default: 20MB max, 14 days retention

# 2. Manually clean old logs (if needed)
find logs/ -name "*.log" -mtime +14 -delete

# 3. Check disk space
df -h

# 4. In Railway, logs are ephemeral (container restarts clear them)
# Use external log aggregation (Loki, Datadog, etc.) for long-term storage
```

### Sensitive Data in Logs

**Problem:** Accidentally logging passwords or tokens

**Solution:**

```typescript
// Logger automatically sanitizes these fields:
// - password, token, secret, authorization, apiKey, etc.

// Example (password will be redacted):
this.logger.log('User login', {
  email: 'user@example.com',
  password: 'secret123', // Automatically becomes '[REDACTED]'
});

// Best practice: Don't log sensitive data at all
this.logger.log('User login', {
  userId: user.id, // ✅ Safe
  // password: user.password, // ❌ Never do this
});
```

**For more details**, see [LOGGING.md](./LOGGING.md).

---

## ⚡ Performance Issues

### Slow Page Load

**Problem:** Pages take > 3 seconds to load

**Solution:**

```typescript
// 1. Use React Server Components
// app/dashboard/page.tsx
export default async function Page() {
  const data = await fetch('...', {
    next: { revalidate: 60 } // Cache for 60s
  });
}

// 2. Implement code splitting
const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false,
});

// 3. Optimize images
<Image
  src="/large.jpg"
  alt="Image"
  width={800}
  height={600}
  quality={75}
  placeholder="blur"
/>

// 4. Check bundle size
pnpm run build
# Look for large chunks

// 5. Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Complex rendering
});
```

### Database Query Slow

**Problem:** Query takes > 500ms

**Solution:**

```typescript
// 1. Add indexes
await db.execute(sql`
  CREATE INDEX idx_shifts_employee_date
  ON shifts(employee_id, start_time);
`);

// 2. Limit results
db.select()
  .from(shifts)
  .where(eq(shifts.employeeId, id))
  .limit(100);  // Don't load thousands of rows

// 3. Use pagination
db.select()
  .from(shifts)
  .limit(20)
  .offset(page * 20);

// 4. Select only needed columns
db.select({
  id: shifts.id,
  startTime: shifts.startTime,
  // Don't select all columns
}).from(shifts);

// 5. Use query explain
console.time('query');
const result = await db.select()...;
console.timeEnd('query');
```

### Memory Leak

**Problem:** Memory usage grows over time

**Solution:**

```typescript
// 1. Clean up useEffect
useEffect(() => {
  const subscription = api.subscribe();

  return () => {
    subscription.unsubscribe(); // ✅ Clean up
  };
}, []);

// 2. Clear intervals
useEffect(() => {
  const interval = setInterval(() => {}, 1000);

  return () => clearInterval(interval); // ✅ Clean up
}, []);

// 3. Close database connections
await client.end();

// 4. Profile with Chrome DevTools
// Performance → Memory → Take snapshot
```

---

## 📱 Mobile App Issues

### Expo Build Fails

**Problem:** `expo build` fails

**Solution:**

```bash
# 1. Clear cache
expo start -c

# 2. Remove node_modules
rm -rf node_modules
pnpm install

# 3. Check app.json config
cat app.json

# 4. Update Expo
pnpm add expo@latest

# 5. Check iOS/Android requirements
expo doctor
```

### Deep Link Not Working

**Problem:** App doesn't open from link

**Solution:**

```json
// app.json
{
  "expo": {
    "scheme": "plandayclone",
    "ios": {
      "bundleIdentifier": "com.yourdomain.planday"
    },
    "android": {
      "package": "com.yourdomain.planday"
    }
  }
}

// Test deep link
adb shell am start -a android.intent.action.VIEW -d "plandayclone://shift/123"
xcrun simctl openurl booted "plandayclone://shift/123"
```

### Push Notifications Not Received

**Problem:** Notifications not arriving

**Solution:**

```typescript
// 1. Check FCM configuration
console.log(process.env.FCM_PROJECT_ID);

// 2. Request permissions
const { status } = await Notifications.requestPermissionsAsync();
console.log('Permission status:', status);

// 3. Get push token
const token = await Notifications.getExpoPushTokenAsync();
console.log('Push token:', token);

// 4. Test with Expo push tool
// https://expo.dev/notifications

// 5. Check device settings
// iOS: Settings → App → Notifications
// Android: Settings → Apps → App → Notifications
```

---

## 🆘 Still Stuck?

### Get Help

1. **Check Documentation**
   - [Quick Start](./QUICK_START.md)
   - [API Reference](./API_REFERENCE.md)
   - [Contributing Guide](./CONTRIBUTING.md)

2. **Search Issues**
   - [GitHub Issues](https://github.com/your-repo/issues)
   - Search for similar problems

3. **Ask for Help**
   - Create a new issue with details
   - Include error messages
   - Provide reproduction steps
   - Share environment info

4. **Community**
   - Discord server
   - GitHub Discussions
   - Stack Overflow (tag: planday-clone)

### Debugging Tips

```bash
# Enable debug logging
DEBUG=* pnpm dev

# Check logs
railway logs --service api

# Monitor processes
htop
docker stats

# Network debugging
curl -v https://api.yourdomain.com/health

# Check DNS
nslookup your-domain.com

# Test WebSocket
wscat -c ws://localhost:3001
```

---

**Last Updated:** November 2025
**Maintained by:** Development Team

Found a solution not listed here? [Contribute](./CONTRIBUTING.md)!
