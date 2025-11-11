# Microservices Architecture

Complete guide to the microservices architecture for Planday Clone.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Service Catalog](#service-catalog)
- [Communication Patterns](#communication-patterns)
- [Data Management](#data-management)
- [Service Discovery](#service-discovery)
- [API Gateway](#api-gateway)
- [Inter-Service Communication](#inter-service-communication)
- [Event-Driven Architecture](#event-driven-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Monitoring & Observability](#monitoring--observability)
- [Failure Handling](#failure-handling)
- [Security](#security)
- [Scaling Strategies](#scaling-strategies)

---

## 🏗️ Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                            │
├──────────────────────┬──────────────────┬──────────────────────┤
│   Web Application    │  Mobile App (iOS) │  Mobile App (Android)│
│   (Next.js 15)       │  (React Native)  │   (React Native)     │
└──────────┬───────────┴─────────┬────────┴──────────────────────┘
           │                     │
           │ HTTPS               │ HTTPS
           │                     │
┌──────────▼─────────────────────▼──────────────────────────────┐
│                     API Gateway Layer                          │
│                    (Cloudflare / Kong)                         │
│  - Rate Limiting                                               │
│  - Authentication                                              │
│  - Request Routing                                             │
│  - Load Balancing                                              │
└──────────┬────────────────────────────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐    ┌───▼───────────────────────────────────────┐
│  Web  │    │         Backend Services                   │
│ BFF   │    │                                            │
│Service│    │  ┌─────────────┐  ┌──────────────┐       │
│       │    │  │   API        │  │   Worker     │       │
│       │    │  │   Service    │  │   Service    │       │
│       │    │  │  (NestJS)    │  │  (NestJS)    │       │
│       │    │  │              │  │              │       │
│       │    │  │ - REST API   │  │ - BullMQ     │       │
│       │    │  │ - GraphQL    │  │ - Cron Jobs  │       │
│       │    │  │ - WebSocket  │  │ - Reports    │       │
│       │    │  └──────┬───────┘  └──────┬───────┘       │
└───────┘    └─────────┼──────────────────┼───────────────┘
                       │                  │
             ┌─────────┴────────┬─────────┴─────────┐
             │                  │                   │
┌────────────▼────┐   ┌─────────▼─────┐  ┌─────────▼──────────┐
│   PostgreSQL    │   │     Redis     │  │   Message Queue    │
│   (Database)    │   │  (Cache/Jobs) │  │     (BullMQ)       │
│                 │   │               │  │                    │
│ - Primary DB    │   │ - Session     │  │ - Async Jobs       │
│ - Read Replica  │   │ - Cache       │  │ - Event Bus        │
└─────────────────┘   │ - Pub/Sub     │  │ - Task Queue       │
                      └───────────────┘  └────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                   External Services                            │
├──────────────┬────────────────┬───────────────┬──────────────┤
│    Clerk     │   Maileroo     │ Cloudflare R2 │ Firebase FCM │
│    (Auth)    │   (Email)      │ (File Storage)│ (Push Notif) │
└──────────────┴────────────────┴───────────────┴──────────────┘

┌───────────────────────────────────────────────────────────────┐
│                 Observability Stack                            │
├──────────────┬────────────────┬───────────────┬──────────────┤
│  Prometheus  │    Grafana     │     Loki      │    Sentry    │
│  (Metrics)   │  (Dashboard)   │  (Logs)       │  (Errors)    │
└──────────────┴────────────────┴───────────────┴──────────────┘
```

---

## 🎯 Service Catalog

### 1. Web Application (Frontend BFF)

**Technology:** Next.js 15, React 19
**Port:** 3000
**Responsibility:** User interface and Backend-for-Frontend

**Key Features:**
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- API Routes for BFF pattern
- Authentication (Clerk)
- Real-time updates (Socket.io client)

**Endpoints:**
- Public: `/`, `/about`, `/pricing`
- Auth: `/sign-in`, `/sign-up`
- Protected: `/dashboard`, `/shifts`, `/schedule`
- API Routes: `/api/*`

**Dependencies:**
- API Service (REST/GraphQL)
- Clerk (Authentication)
- Cloudflare R2 (File uploads)

**Scaling:**
- Horizontal scaling with load balancer
- CDN for static assets (Cloudflare)
- Edge functions for API routes

---

### 2. API Service (Core Backend)

**Technology:** NestJS 10, TypeScript
**Port:** 3001
**Responsibility:** Core business logic and data operations

**Key Features:**
- RESTful API endpoints
- GraphQL API (optional)
- WebSocket server (Socket.io)
- JWT authentication
- RBAC authorization
- Rate limiting
- Request validation (Zod)

**Modules:**
```
apps/api/src/
├── auth/              # Authentication & Authorization
├── organizations/     # Organization management
├── employees/         # Employee management
├── shifts/            # Shift scheduling
├── schedules/         # Schedule management
├── time-tracking/     # Clock in/out
├── leave-requests/    # Leave management
├── shift-swaps/       # Shift swap requests
├── notifications/     # Notification service
├── messages/          # Internal messaging
├── documents/         # Document management
├── reports/           # Report generation
└── webhooks/          # Webhook handling
```

**Database Access:**
- Direct PostgreSQL connection via Drizzle ORM
- Read replicas for queries
- Write to primary database
- Redis for caching

**Dependencies:**
- PostgreSQL (Database)
- Redis (Cache & Pub/Sub)
- BullMQ (Job queue)
- Clerk (JWT verification)
- Maileroo (Email sending)
- Cloudflare R2 (File storage)

**Scaling:**
- Horizontal scaling with load balancer
- Database connection pooling
- Redis cluster for caching
- Separate read/write database connections

---

### 3. Worker Service (Background Jobs)

**Technology:** NestJS 10, TypeScript
**Port:** 3002
**Responsibility:** Async job processing and scheduled tasks

**Key Features:**
- BullMQ job processing
- Cron jobs
- Report generation
- Email notifications
- Data cleanup
- Analytics processing

**Job Types:**
```typescript
// Job Queue Structure
{
  "email-notifications": {
    priority: "high",
    attempts: 3,
    backoff: "exponential"
  },
  "report-generation": {
    priority: "medium",
    attempts: 2,
    timeout: 300000 // 5 minutes
  },
  "data-sync": {
    priority: "low",
    attempts: 1,
    cron: "0 2 * * *" // Daily at 2 AM
  },
  "payroll-calculation": {
    priority: "high",
    attempts: 3,
    cron: "0 0 1 * *" // Monthly on 1st
  }
}
```

**Scheduled Jobs:**
- **Daily (2 AM):** Data cleanup, analytics aggregation
- **Weekly (Sunday 3 AM):** Schedule reminders, report generation
- **Monthly (1st, 12 AM):** Payroll calculations, invoice generation
- **Hourly:** Notification digests, cache warming

**Dependencies:**
- PostgreSQL (Database)
- Redis (Job queue via BullMQ)
- Maileroo (Email sending)
- Cloudflare R2 (Report storage)

**Scaling:**
- Multiple worker instances
- Job concurrency configuration
- Queue-based load distribution
- Dedicated queues for different job types

---

### 4. Mobile Application

**Technology:** React Native 0.76, Expo SDK 52
**Platforms:** iOS & Android
**Responsibility:** Mobile client application

**Key Features:**
- Offline-first architecture
- GPS location tracking
- Camera integration
- Push notifications
- Biometric authentication
- Real-time updates

**Local Storage:**
- MMKV for fast key-value storage
- SQLite for offline data (optional)
- Secure storage for sensitive data

**Dependencies:**
- API Service (REST)
- Clerk (Authentication)
- Firebase FCM (Push notifications)

**Scaling:**
- N/A (client-side application)
- OTA updates via Expo

---

## 🔗 Communication Patterns

### 1. Synchronous Communication (REST/GraphQL)

**REST API (Primary):**
```typescript
// Request/Response pattern
Client → API Service
  GET /api/v1/shifts?startDate=2025-12-01&endDate=2025-12-31
  Authorization: Bearer <jwt_token>

API Service → Client
  200 OK
  { data: [...], meta: {...} }
```

**GraphQL (Optional):**
```graphql
# Query multiple resources in single request
query GetDashboard {
  currentUser {
    id
    email
    employee {
      upcomingShifts {
        id
        startTime
        endTime
      }
    }
  }
  notifications(limit: 10) {
    id
    title
    isRead
  }
}
```

**Use Cases:**
- CRUD operations
- Real-time data queries
- User interactions

**Advantages:**
- Simple request/response model
- Easy to debug
- Type-safe with TypeScript

**Disadvantages:**
- Tight coupling
- Point-to-point connections
- Blocking operations

---

### 2. Asynchronous Communication (Message Queue)

**BullMQ Job Queue:**
```typescript
// Producer (API Service)
await emailQueue.add('send-shift-notification', {
  employeeId: 'uuid',
  shiftId: 'uuid',
  type: 'shift_assigned',
});

// Consumer (Worker Service)
emailQueue.process('send-shift-notification', async (job) => {
  const { employeeId, shiftId, type } = job.data;

  const employee = await getEmployee(employeeId);
  const shift = await getShift(shiftId);

  await maileroo.send({
    to: employee.email,
    subject: 'New Shift Assigned',
    template: 'shift-assigned',
    data: { shift },
  });
});
```

**Queue Types:**
- **High Priority:** Email notifications, SMS
- **Medium Priority:** Report generation, data export
- **Low Priority:** Analytics, cleanup tasks

**Use Cases:**
- Email notifications
- Report generation
- Data processing
- Scheduled tasks
- Long-running operations

**Advantages:**
- Decoupled services
- Resilient to failures
- Load leveling
- Retry mechanisms

---

### 3. Real-Time Communication (WebSocket)

**Socket.io Implementation:**
```typescript
// Server (API Service)
io.on('connection', (socket) => {
  const { userId, orgId } = socket.handshake.auth;

  // Join organization room
  socket.join(`org:${orgId}`);

  // Listen for events
  socket.on('shift:update', async (data) => {
    const shift = await updateShift(data);

    // Broadcast to organization
    io.to(`org:${orgId}`).emit('shift:updated', shift);
  });
});

// Client (Web/Mobile)
const socket = io('wss://api.yourdomain.com', {
  auth: { token: await getToken() },
});

socket.on('shift:updated', (shift) => {
  // Update UI in real-time
  queryClient.invalidateQueries(['shifts']);
});
```

**Real-Time Events:**
- `shift:created` - New shift scheduled
- `shift:updated` - Shift modified
- `shift:deleted` - Shift cancelled
- `message:new` - New message received
- `notification:new` - New notification
- `user:online` - User status change

**Use Cases:**
- Live schedule updates
- Chat messaging
- Notifications
- Collaborative editing

---

### 4. Event-Driven Communication (Pub/Sub)

**Redis Pub/Sub:**
```typescript
// Publisher (API Service)
await redis.publish('shift.created', JSON.stringify({
  shiftId: 'uuid',
  employeeId: 'uuid',
  organizationId: 'uuid',
  timestamp: new Date().toISOString(),
}));

// Subscriber (Worker Service)
await redis.subscribe('shift.created', async (message) => {
  const event = JSON.parse(message);

  // Send notification
  await notificationService.notifyEmployee(event.employeeId, {
    type: 'shift_assigned',
    data: event,
  });

  // Update analytics
  await analyticsService.trackEvent('shift_created', event);
});
```

**Event Types:**
- `shift.*` - Shift-related events
- `employee.*` - Employee events
- `schedule.*` - Schedule events
- `timeEntry.*` - Time tracking events
- `leaveRequest.*` - Leave request events

**Use Cases:**
- Cross-service notifications
- Analytics tracking
- Audit logging
- Cache invalidation

---

## 💾 Data Management

### Database Strategy: Shared Database

**Architecture:**
```
┌─────────────────────────────────────┐
│         Shared PostgreSQL           │
│                                     │
│  - organizations                    │
│  - users                            │
│  - employees                        │
│  - shifts                           │
│  - schedules                        │
│  - time_entries                     │
│  - leave_requests                   │
│  - ... (all 27 tables)              │
└──────────┬──────────────────────────┘
           │
    ┌──────┴───────┐
    │              │
┌───▼───┐     ┌───▼────────┐
│  API  │     │   Worker   │
│Service│     │  Service   │
└───────┘     └────────────┘
```

**Rationale:**
- **Simplicity:** Single source of truth
- **ACID Transactions:** Cross-entity consistency
- **Joins:** Efficient queries across entities
- **Cost-Effective:** Single database to maintain

**Trade-offs:**
- ✅ Strong consistency
- ✅ Easy to implement
- ✅ Simple transactions
- ❌ Tight coupling
- ❌ Scaling challenges
- ❌ Schema coordination needed

**Alternative: Database Per Service (Future)**

If you need to scale further:
```
┌───────────┐     ┌───────────┐     ┌───────────┐
│   API     │     │  Worker   │     │  Analytics│
│  Service  │     │  Service  │     │  Service  │
└─────┬─────┘     └─────┬─────┘     └─────┬─────┘
      │                 │                 │
┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
│   Main    │     │   Jobs    │     │  Analytics│
│ Database  │     │ Database  │     │  Database │
└───────────┘     └───────────┘     └───────────┘
```

**Challenges:**
- Distributed transactions (Saga pattern)
- Data consistency
- Cross-database queries
- Schema duplication

---

### Caching Strategy

**Multi-Layer Caching:**

```typescript
// 1. Application-Level Cache (In-Memory)
const cache = new Map<string, any>();

async function getEmployee(id: string) {
  // Check memory cache
  if (cache.has(id)) {
    return cache.get(id);
  }

  // Check Redis
  const cached = await redis.get(`employee:${id}`);
  if (cached) {
    const employee = JSON.parse(cached);
    cache.set(id, employee);
    return employee;
  }

  // Fetch from database
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, id),
  });

  // Cache in Redis (1 hour)
  await redis.setex(`employee:${id}`, 3600, JSON.stringify(employee));
  cache.set(id, employee);

  return employee;
}
```

**Cache Invalidation:**
```typescript
// After update
await db.update(employees).set({ name: 'New Name' }).where(eq(employees.id, id));

// Invalidate cache
cache.delete(id);
await redis.del(`employee:${id}`);

// Publish cache invalidation event
await redis.publish('cache:invalidate', JSON.stringify({
  type: 'employee',
  id,
}));
```

**Cache Patterns:**
- **Cache-Aside:** Application manages cache
- **Write-Through:** Update cache on write
- **Write-Behind:** Async cache updates
- **Refresh-Ahead:** Proactive cache refresh

---

## 🌐 API Gateway

### Cloudflare as API Gateway

**Features:**
- Global CDN
- DDoS protection
- Rate limiting
- SSL/TLS termination
- Request routing
- Load balancing

**Configuration:**
```javascript
// Cloudflare Workers (Edge)
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Route to appropriate service
  if (url.pathname.startsWith('/api/')) {
    return routeToAPI(request);
  } else {
    return routeToWeb(request);
  }
}

async function routeToAPI(request) {
  // Add rate limiting
  const rateLimitKey = request.headers.get('CF-Connecting-IP');
  const rateLimit = await checkRateLimit(rateLimitKey);

  if (rateLimit.exceeded) {
    return new Response('Too Many Requests', { status: 429 });
  }

  // Forward to API service
  return fetch('https://api-service.railway.app' + url.pathname, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
}
```

**Alternative: Kong API Gateway**

If you need more advanced features:
```yaml
# kong.yml
services:
  - name: api-service
    url: http://api-service:3001
    routes:
      - name: api-route
        paths:
          - /api
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          policy: local
      - name: jwt
        config:
          claims_to_verify:
            - exp
      - name: cors
        config:
          origins:
            - https://yourdomain.com
```

---

## 🔄 Inter-Service Communication

### Service-to-Service Authentication

**JWT Token Propagation:**
```typescript
// API Service → Worker Service (via Queue)
await jobQueue.add('generate-report', {
  reportId: 'uuid',
  userId: 'uuid',
  organizationId: 'uuid',
  // Don't include JWT token in queue
  // Worker will use service account
});

// Worker Service (Service Account)
const serviceToken = await generateServiceToken({
  service: 'worker',
  permissions: ['read:reports', 'write:reports'],
});

const report = await fetch('https://api-service/internal/reports', {
  headers: {
    'Authorization': `Bearer ${serviceToken}`,
    'X-Service-Name': 'worker',
  },
});
```

**Internal API Endpoints:**
```typescript
// apps/api/src/internal/internal.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';

@Controller('internal')
@UseGuards(ServiceAuthGuard) // Only allows service-to-service calls
export class InternalController {
  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }

  @Get('employees/:id')
  async getEmployee(@Param('id') id: string) {
    // Internal endpoint with no rate limiting
    return this.employeesService.findOne(id);
  }
}
```

---

## 📊 Event-Driven Architecture

### Event Bus Implementation

**Event Schema:**
```typescript
interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  organizationId: string;
  payload: Record<string, any>;
  metadata: {
    userId?: string;
    timestamp: string;
    version: number;
  };
}
```

**Event Publishing:**
```typescript
// Event Publisher Service
class EventPublisher {
  async publish(event: DomainEvent) {
    // Store event in database (Event Sourcing)
    await db.insert(events).values(event);

    // Publish to Redis Pub/Sub
    await redis.publish(event.eventType, JSON.stringify(event));

    // Publish to BullMQ for async processing
    await eventQueue.add(event.eventType, event);
  }
}

// Usage
await eventPublisher.publish({
  eventId: uuid(),
  eventType: 'shift.created',
  aggregateId: shift.id,
  aggregateType: 'shift',
  organizationId: shift.organizationId,
  payload: shift,
  metadata: {
    userId: currentUser.id,
    timestamp: new Date().toISOString(),
    version: 1,
  },
});
```

**Event Subscribers:**
```typescript
// Notification Service Subscriber
eventBus.subscribe('shift.created', async (event) => {
  await sendNotification({
    employeeId: event.payload.employeeId,
    type: 'shift_assigned',
    data: event.payload,
  });
});

// Analytics Service Subscriber
eventBus.subscribe('shift.created', async (event) => {
  await trackAnalyticsEvent({
    event: 'shift_created',
    organizationId: event.organizationId,
    timestamp: event.metadata.timestamp,
  });
});

// Audit Log Subscriber
eventBus.subscribe('*', async (event) => {
  await auditLog.log({
    action: event.eventType,
    userId: event.metadata.userId,
    resource: event.aggregateType,
    resourceId: event.aggregateId,
    timestamp: event.metadata.timestamp,
  });
});
```

---

## 🚀 Deployment Architecture

### Railway Deployment

**Service Configuration:**
```yaml
# railway.json
services:
  web:
    builder: DOCKERFILE
    dockerfilePath: ./dockerfiles/Dockerfile.web
    healthcheckPath: /api/health
    healthcheckTimeout: 60
    watchPatterns:
      - apps/web/**
    envVars:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${{api.url}}

  api:
    builder: DOCKERFILE
    dockerfilePath: ./dockerfiles/Dockerfile.api
    healthcheckPath: /health
    healthcheckTimeout: 60
    watchPatterns:
      - apps/api/**
    envVars:
      NODE_ENV: production
      DATABASE_URL: ${{postgres.url}}
      REDIS_URL: ${{redis.url}}

  worker:
    builder: DOCKERFILE
    dockerfilePath: ./dockerfiles/Dockerfile.worker
    healthcheckPath: /health
    watchPatterns:
      - apps/worker/**
    envVars:
      NODE_ENV: production
      DATABASE_URL: ${{postgres.url}}
      REDIS_URL: ${{redis.url}}

  postgres:
    image: postgres:17-alpine
    envVars:
      POSTGRES_DB: planday
      POSTGRES_USER: ${{secrets.DB_USER}}
      POSTGRES_PASSWORD: ${{secrets.DB_PASSWORD}}

  redis:
    image: redis:7.4-alpine
```

**Service Dependencies:**
```
┌──────────────────────────────────────────┐
│  Dependency Graph                         │
│                                          │
│  postgres ──┐                            │
│             ├──→ api ──→ web             │
│  redis ─────┤                            │
│             └──→ worker                  │
└──────────────────────────────────────────┘
```

---

## 📈 Monitoring & Observability

### Distributed Tracing

**OpenTelemetry Implementation:**
```typescript
import { trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new SimpleSpanProcessor(new JaegerExporter())
);
provider.register();

const tracer = trace.getTracer('api-service');

// Trace requests
app.use((req, res, next) => {
  const span = tracer.startSpan('http_request', {
    attributes: {
      'http.method': req.method,
      'http.url': req.url,
      'http.user_agent': req.headers['user-agent'],
    },
  });

  res.on('finish', () => {
    span.setAttribute('http.status_code', res.statusCode);
    span.end();
  });

  next();
});
```

**Correlation IDs:**
```typescript
// Generate correlation ID
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuid();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

// Pass to downstream services
const response = await fetch('https://api-service/endpoint', {
  headers: {
    'x-correlation-id': req.correlationId,
  },
});

// Log with correlation ID
logger.info('Processing request', {
  correlationId: req.correlationId,
  userId: req.user.id,
});
```

---

## 🛡️ Failure Handling

### Circuit Breaker Pattern

```typescript
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(asyncFunction, {
  timeout: 3000, // 3 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 30000, // 30 seconds
});

breaker.fallback(() => {
  return { error: 'Service temporarily unavailable' };
});

breaker.on('open', () => {
  logger.error('Circuit breaker opened');
});

// Usage
const result = await breaker.fire(params);
```

### Retry Logic

```typescript
import retry from 'async-retry';

await retry(
  async () => {
    const response = await fetch('https://external-api.com/data');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
  {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 5000,
    onRetry: (error, attempt) => {
      logger.warn(`Retry attempt ${attempt}`, { error });
    },
  }
);
```

---

## 🔒 Security

### Service Mesh (Optional - Future)

**Istio for Advanced Security:**
```yaml
# istio-config.yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: api-service
spec:
  hosts:
    - api-service
  http:
    - match:
        - headers:
            x-service-token:
              exact: "service-secret"
      route:
        - destination:
            host: api-service
            port:
              number: 3001
```

### mTLS (Mutual TLS)

```typescript
// Service-to-service with mTLS
import https from 'https';
import fs from 'fs';

const agent = new https.Agent({
  cert: fs.readFileSync('./certs/service.crt'),
  key: fs.readFileSync('./certs/service.key'),
  ca: fs.readFileSync('./certs/ca.crt'),
});

const response = await fetch('https://internal-service', { agent });
```

---

## 📊 Scaling Strategies

### Horizontal Scaling

**Auto-scaling Configuration (Railway):**
```json
{
  "services": {
    "api": {
      "minReplicas": 2,
      "maxReplicas": 10,
      "targetCPU": 70,
      "targetMemory": 80
    },
    "worker": {
      "minReplicas": 1,
      "maxReplicas": 5,
      "targetQueueSize": 100
    }
  }
}
```

### Vertical Scaling

**Resource Allocation:**
```yaml
# Railway service configuration
api:
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "2Gi"
      cpu: "2000m"
```

---

## 🎯 Best Practices

### 1. Design Principles

- ✅ **Single Responsibility:** Each service has one clear purpose
- ✅ **Loose Coupling:** Services are independent
- ✅ **High Cohesion:** Related functionality grouped together
- ✅ **Autonomous:** Services can be deployed independently
- ✅ **Observable:** Comprehensive logging and monitoring
- ✅ **Resilient:** Handle failures gracefully

### 2. Communication Guidelines

- ✅ Use async communication for non-critical operations
- ✅ Implement timeouts for all external calls
- ✅ Use circuit breakers for failing services
- ✅ Cache frequently accessed data
- ✅ Implement idempotency for all write operations

### 3. Data Management

- ✅ Single source of truth for each data entity
- ✅ Eventual consistency where appropriate
- ✅ Avoid distributed transactions
- ✅ Use event sourcing for audit trails
- ✅ Implement proper database connection pooling

---

## 📚 References

- [Microservices Patterns](https://microservices.io/patterns/)
- [12-Factor App](https://12factor.net/)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)

---

**Last Updated:** November 2025
**Architecture Version:** 1.0
**Status:** Production-Ready
