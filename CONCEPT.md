# Planday Clone - Tech Stack mit Clerk + Maileroo (Railway Deployment)

## Executive Summary

Komplettes Workforce Management System mit **optimaler Balance** zwischen Open Source und bewährten SaaS-Tools:
- ✅ **Clerk** für Auth + Payment (schnellere Time-to-Market)
- ✅ **Maileroo** für Emails (günstig & zuverlässig)
- ✅ **Open Source** für Rest (PostgreSQL, Redis, Monitoring, etc.)
- ✅ **Railway** für Hosting (einfach & günstig)

**Kernzielgruppe**: KMUs mit 10-500 Mitarbeitern in schichtbasierten Branchen

---

## 1. Tech Stack - Optimale Balance

### 1.1 Frontend Web

**Framework & Core:**
- **Next.js 15** (App Router, React Server Components)
- **React 19** (neueste)
- **TypeScript 5.7** (neueste)
- **Node.js 22.x LTS** (neueste)

**UI & Styling:**
- **Tailwind CSS 4.0** (neueste)
- **shadcn/ui** (MIT License) + Radix UI
- **Lucide Icons** (ISC License)
- **Framer Motion 11.x** (MIT License)

**State Management:**
- **Zustand 5.x** (MIT License)
- **TanStack Query v5** (MIT License)

**Forms & Validation:**
- **React Hook Form 7.x** (MIT License)
- **Zod 3.x** (MIT License)

**Calendar/Scheduling:**
- **@fullcalendar/react 6.x** (MIT License)
- **@dnd-kit/core** (MIT License) - Drag & Drop
- **date-fns 4.x** (MIT License)

**Charts:**
- **Recharts 2.x** (MIT License)
- **Apache ECharts** (Apache 2.0)

**Real-time:**
- **Socket.io 4.x Client** (MIT License)

### 1.2 Mobile Apps

**Framework:**
- **React Native 0.76.x** (MIT License)
- **Expo SDK 52** (MIT License)
- **Expo Router** (file-based routing)

**State & Data:**
- **Zustand 5.x** (MIT License)
- **TanStack Query v5** (MIT License)

**Native Features:**
- **expo-location** - GPS/Geolocation
- **expo-camera** - Check-in Fotos
- **expo-notifications** - Push Notifications
- **react-native-firebase** (Apache 2.0) - FCM

**UI:**
- **React Native Paper 5.x** (MIT License)
- **Tamagui** (MIT License)

### 1.3 Backend API

**Framework:**
- **NestJS 10.x** (MIT License)
- **Fastify** (MIT License) - schneller als Express
- **TypeScript 5.7**
- **Node.js 22.x LTS**

**API Tools:**
- **Swagger/OpenAPI 3.1** (Apache 2.0)
- **Class-validator** (MIT License)
- **Class-transformer** (MIT License)

**Testing:**
- **Vitest** (MIT License) - schneller als Jest
- **Supertest** (MIT License)
- **Playwright** (Apache 2.0) - E2E

### 1.4 Authentication & Payment (SaaS)

**Clerk** - All-in-One Auth + Payment ✅

**Warum Clerk?**
- ✅ Auth + Payment in einem System
- ✅ Pre-built UI Components (schnellere Entwicklung)
- ✅ Multi-Tenancy Support
- ✅ SSO, MFA, OAuth built-in
- ✅ User Management Dashboard
- ✅ Webhooks
- ✅ B2B Features
- ✅ Subscription Billing
- ✅ Stripe Integration (managed)

**Clerk Features:**
```typescript
// Auth
- Email/Password
- Magic Links
- OAuth (Google, Microsoft, GitHub, etc.)
- SSO (SAML, OIDC)
- MFA/2FA
- Session Management
- JWT Tokens
- Webhooks

// Payment (via Clerk Payments)
- Subscription Management
- Stripe Integration
- Usage-based Billing
- Invoice Generation
- Payment Methods Management
- Dunning Management
```

**Pricing:**
- **Free**: 10,000 MAU (Monthly Active Users)
- **Pro**: $25/Monat + $0.02/MAU
- **Enterprise**: Custom Pricing

**Für 1000 aktive User:**
```
$25/Monat (Base) + (1000 × $0.02) = $45/Monat
```

### 1.5 Email Service (SaaS)

**Maileroo** - Email Delivery ✅

**Warum Maileroo?**
- ✅ Günstiger als SendGrid/Mailgun
- ✅ Hervorragende Deliverability
- ✅ DKIM, SPF, DMARC included
- ✅ API-first
- ✅ Templates Support
- ✅ Webhooks (Bounce, Click, Open)
- ✅ SMTP + HTTP API
- ✅ EU Server verfügbar (GDPR)

**Features:**
```typescript
- Transactional Emails
- Marketing Emails
- Email Templates
- Bounce Handling
- Click/Open Tracking
- Webhooks
- Analytics
- EU & US Regions
```

**Pricing:**
- **Starter**: $9/Monat - 10,000 Emails
- **Growth**: $29/Monat - 50,000 Emails
- **Business**: $79/Monat - 200,000 Emails
- **Custom**: Ab $199/Monat

**Für 1000 User** (≈5000 Emails/Monat):
```
$9/Monat (Starter Plan)
```

**Alternative Email-Lösungen:**
- **Resend** ($20/Monat für 50k Emails) - Developer-freundlich
- **Amazon SES** (Pay-as-you-go: $0.10 per 1000 Emails)
- **Postmark** ($15/Monat für 10k Emails) - Premium Deliverability

### 1.6 Datenbanken (Open Source)

**Primary Database:**
- **PostgreSQL 17** (neueste, PostgreSQL License)
- **Railway Managed PostgreSQL** (automatische Backups)

**ORM:**
- **Drizzle ORM** (Apache 2.0) - modernste Type-Safe ORM
- **Alternative**: Prisma 6.x (Apache 2.0)

**Extensions:**
- **TimescaleDB** (Apache 2.0) - Time-Series
- **PostGIS** (GPL v2) - Geospatial
- **pgvector** (PostgreSQL License) - AI/ML Features

**Caching & Jobs:**
- **Redis 7.4** (BSD-3-Clause)
- **Railway Managed Redis**
- **BullMQ 5.x** (MIT License) - Job Queue

### 1.7 File Storage (Open Source + Cloud)

**Options:**

**Option 1: Cloudflare R2** (S3-compatible, empfohlen) ✅
- 10 GB Storage kostenlos
- $0.015/GB danach
- Keine Egress-Gebühren!
- S3-kompatible API
- CDN included
- GDPR-compliant (EU Region)

**Option 2: AWS S3**
- Standard S3 Pricing
- Mit CloudFront CDN
- Lifecycle Policies

**Option 3: MinIO** (self-hosted auf Railway)
- AGPL v3 License
- S3-kompatibel
- Self-hosted Option

**Empfehlung für Railway**: **Cloudflare R2**
- Günstig
- Keine Egress-Gebühren
- Einfache Integration
- Perfekt für SaaS

### 1.8 Monitoring & Logging (Open Source)

**Application Performance:**
- **Grafana** (AGPL v3) - Dashboards
- **Prometheus** (Apache 2.0) - Metrics
- **Loki** (AGPL v3) - Log Aggregation
- **Tempo** (AGPL v3) - Tracing

**Error Tracking:**
- **Sentry** (self-hosted, BSL)
- **GlitchTip** (MIT License) - Sentry-kompatibel

**Uptime Monitoring:**
- **Uptime Kuma** (MIT License) - self-hosted
- **Better Uptime** (hat Free Tier)

**Empfehlung**: **Grafana Stack + Sentry**

### 1.9 Analytics (Open Source)

**Web Analytics:**
- **Umami** (MIT License) - EMPFOHLUNG
  - Privacy-first
  - GDPR-compliant
  - Lightweight
  - Self-hosted auf Railway
- **Plausible** (AGPL v3) - Alternative

**Product Analytics:**
- **PostHog** (MIT License) - self-hosted
  - Session Recording
  - Feature Flags
  - A/B Testing
  - Heatmaps

### 1.10 Search Engine (Open Source)

**Full-Text Search:**
- **Meilisearch** (MIT License) - EMPFOHLUNG
  - Ultra-schnell
  - Typo Tolerance
  - Faceting
  - Multi-Language
  - Deploy auf Railway
- **Typesense** (GPL v3) - Alternative

### 1.11 Real-Time Communication (Open Source)

**WebSocket:**
- **Socket.io 4.x** (MIT License) - bewährt
- **Soketi** (MIT License) - Pusher Alternative
- **Centrifugo** (MIT License) - hochperformant

### 1.12 Background Jobs (Open Source)

**Job Queue:**
- **BullMQ** (MIT License) - Redis-based, EMPFOHLUNG
  - Email Versand
  - Report Generation
  - Notification Dispatch
  - Scheduled Tasks

**Cron/Scheduling:**
- **node-cron** (ISC License)
- Built-in NestJS Scheduler

### 1.13 SMS Service (Optional SaaS)

**Options:**
- **Twilio** - Standard, bewährt
- **Vonage (Nexmo)** - günstiger
- **MessageBird** - EU-fokussiert
- **Sinch** - gut für Europa

**Für MVP**: Optional weglassen, nur Email & Push

### 1.14 Push Notifications (Free)

**Firebase Cloud Messaging (FCM)**
- Komplett kostenlos
- Unbegrenzte Nachrichten
- iOS & Android
- Web Push

---

## 2. Datenbank-Schema (PostgreSQL + Drizzle ORM)

### 2.1 Core Tables (mit Clerk Integration)

```typescript
// schema.ts - Drizzle ORM Schema
import { pgTable, uuid, varchar, text, timestamp, boolean, decimal, integer, jsonb, date } from 'drizzle-orm/pg-core';

// Organizations (Multi-Tenancy)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }).unique(), // Clerk Organization ID
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  logoUrl: text('logo_url'),
  timezone: varchar('timezone', { length: 50 }).default('Europe/Berlin'),
  countryCode: varchar('country_code', { length: 2 }).default('DE'),
  settings: jsonb('settings').default({}),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('starter'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('active'), // active, past_due, cancelled
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users (synced from Clerk via Webhooks)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(), // Clerk User ID
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  emailVerified: timestamp('email_verified'),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 50 }).default('employee'), // employee, manager, admin, super_admin
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastSeenAt: timestamp('last_seen_at'),
});

// Employees (extended user data)
export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  employeeNumber: varchar('employee_number', { length: 50 }),
  locationId: uuid('location_id').references(() => locations.id),
  hireDate: date('hire_date'),
  terminationDate: date('termination_date'),
  contractType: varchar('contract_type', { length: 50 }), // hourly, salary, part_time, full_time
  contractedHoursPerWeek: decimal('contracted_hours_per_week', { precision: 5, scale: 2 }),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  salaryAnnual: decimal('salary_annual', { precision: 12, scale: 2 }),
  emergencyContact: jsonb('emergency_contact'),
  isActive: boolean('is_active').default(true),
  skills: jsonb('skills').default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Locations/Departments
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  timezone: varchar('timezone', { length: 50 }),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

// Shifts (Kern-Feature)
export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id').references(() => schedules.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'set null' }), // NULL = open shift
  positionId: uuid('position_id').references(() => positions.id),
  shiftTypeId: uuid('shift_type_id').references(() => shiftTypes.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  breakMinutes: integer('break_minutes').default(0),
  status: varchar('status', { length: 50 }).default('scheduled'), // scheduled, approved, draft, open, for_sale
  isPublished: boolean('is_published').default(false),
  notes: text('notes'),
  requiredSkills: jsonb('required_skills').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Time Clock Entries
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }),
  shiftId: uuid('shift_id').references(() => shifts.id, { onDelete: 'set null' }),
  locationId: uuid('location_id').references(() => locations.id),
  clockInTime: timestamp('clock_in_time').notNull(),
  clockOutTime: timestamp('clock_out_time'),
  clockInLatitude: decimal('clock_in_latitude', { precision: 10, scale: 8 }),
  clockInLongitude: decimal('clock_in_longitude', { precision: 11, scale: 8 }),
  clockOutLatitude: decimal('clock_out_latitude', { precision: 10, scale: 8 }),
  clockOutLongitude: decimal('clock_out_longitude', { precision: 11, scale: 8 }),
  clockInPhotoUrl: text('clock_in_photo_url'),
  clockOutPhotoUrl: text('clock_out_photo_url'),
  totalMinutes: integer('total_minutes'),
  breakMinutes: integer('break_minutes').default(0),
  notes: text('notes'),
  approved: boolean('approved').default(false),
  approvedBy: uuid('approved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Subscriptions (via Clerk Payments)
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  clerkSubscriptionId: varchar('clerk_subscription_id', { length: 255 }), // Clerk Subscription ID
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }), // Stripe ID (via Clerk)
  tier: varchar('tier', { length: 50 }).notNull(), // starter, plus, pro, enterprise
  status: varchar('status', { length: 50 }).notNull(), // active, past_due, cancelled, trialing
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  trialEnd: timestamp('trial_end'),
  seats: integer('seats').default(1), // Number of users
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ... weitere Tables analog zum Original-Dokument
```

---

## 3. Clerk Integration

### 3.1 Clerk Setup

```bash
npm install @clerk/nextjs @clerk/backend
```

### 3.2 Next.js Middleware

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### 3.3 Root Layout

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={deDE}>
      <html lang="de">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### 3.4 Clerk Webhooks (User Sync)

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { users, organizations } from '@/lib/schema';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);
  
  let evt;
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id!,
      'svix-timestamp': svix_timestamp!,
      'svix-signature': svix_signature!,
    });
  } catch (err) {
    return new Response('Webhook verification failed', { status: 400 });
  }

  const eventType = evt.type;
  
  // User Created
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    
    await db.insert(users).values({
      clerkUserId: id,
      email: email_addresses[0].email_address,
      firstName: first_name,
      lastName: last_name,
      avatarUrl: image_url,
    });
  }
  
  // User Updated
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    
    await db.update(users)
      .set({
        email: email_addresses[0].email_address,
        firstName: first_name,
        lastName: last_name,
        avatarUrl: image_url,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkUserId, id));
  }
  
  // Organization Created
  if (eventType === 'organization.created') {
    const { id, name, slug, image_url } = evt.data;
    
    await db.insert(organizations).values({
      clerkOrgId: id,
      name,
      slug,
      logoUrl: image_url,
    });
  }
  
  return new Response('Webhook processed', { status: 200 });
}
```

### 3.5 Organizations & Multi-Tenancy

```typescript
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId, orgId } = await auth();
  
  if (!userId) redirect('/sign-in');
  if (!orgId) redirect('/onboarding');
  
  // Get organization data
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.clerkOrgId, orgId),
  });
  
  return (
    <div>
      <h1>Dashboard - {org.name}</h1>
    </div>
  );
}
```

---

## 4. Maileroo Integration

### 4.1 Maileroo Setup

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### 4.2 Email Service

```typescript
// lib/email/maileroo.ts
import nodemailer from 'nodemailer';

// Maileroo SMTP Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.maileroo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAILEROO_USER, // Your SMTP username
    pass: process.env.MAILEROO_PASSWORD, // Your SMTP password
  },
});

// Or use HTTP API
import fetch from 'node-fetch';

export class MailerooService {
  private apiKey: string;
  private apiUrl = 'https://smtp.maileroo.com/api/v1/send';
  
  constructor() {
    this.apiKey = process.env.MAILEROO_API_KEY!;
  }
  
  async sendEmail({
    to,
    subject,
    html,
    text,
    from = process.env.EMAIL_FROM,
  }: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
  }) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        from: {
          email: from,
          name: 'Planday Clone',
        },
        to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
        subject,
        html,
        text,
        headers: {
          'X-Maileroo-Tag': 'planday-transactional',
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Maileroo API Error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Send Template Email
  async sendTemplate({
    to,
    templateId,
    variables,
  }: {
    to: string;
    templateId: string;
    variables: Record<string, any>;
  }) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        from: {
          email: process.env.EMAIL_FROM,
          name: 'Planday Clone',
        },
        to: [{ email: to }],
        template_id: templateId,
        variables,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Maileroo Template Error: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

### 4.3 Email Templates mit React Email

```bash
npm install react-email @react-email/components
```

```typescript
// emails/ShiftAssigned.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

interface ShiftAssignedEmailProps {
  employeeName: string;
  shiftDate: string;
  shiftTime: string;
  location: string;
}

export const ShiftAssignedEmail = ({
  employeeName,
  shiftDate,
  shiftTime,
  location,
}: ShiftAssignedEmailProps) => (
  <Html>
    <Head />
    <Preview>Neue Schicht zugewiesen: {shiftDate}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hallo {employeeName}!</Heading>
        <Text style={text}>
          Du wurdest für eine neue Schicht eingeteilt:
        </Text>
        <Text style={text}>
          <strong>Datum:</strong> {shiftDate}<br />
          <strong>Zeit:</strong> {shiftTime}<br />
          <strong>Standort:</strong> {location}
        </Text>
        <Button style={button} href={process.env.NEXT_PUBLIC_APP_URL}>
          Schicht ansehen
        </Button>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
};
```

### 4.4 Email Service mit BullMQ

```typescript
// workers/email-worker.ts
import { Worker } from 'bullmq';
import { MailerooService } from '@/lib/email/maileroo';
import { render } from '@react-email/render';
import { ShiftAssignedEmail } from '@/emails/ShiftAssigned';

const maileroo = new MailerooService();

export const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    const { type, data } = job.data;
    
    if (type === 'shift-assigned') {
      const html = render(ShiftAssignedEmail(data));
      
      await maileroo.sendEmail({
        to: data.employeeEmail,
        subject: `Neue Schicht zugewiesen: ${data.shiftDate}`,
        html,
      });
    }
    
    return { success: true };
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  }
);
```

---

## 5. Railway Deployment

### 5.1 Services auf Railway

```
1. PostgreSQL (Plugin) - managed
2. Redis (Plugin) - managed
3. Web (Next.js) - Dockerfile.web
4. API (NestJS) - Dockerfile.api
5. Worker (BullMQ) - Dockerfile.worker
```

### 5.2 Environment Variables

**Web Service:**
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# API
NEXT_PUBLIC_API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}
```

**API Service:**
```env
# Clerk (für API Verification)
CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# Database & Cache
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Maileroo
MAILEROO_API_KEY=<your-api-key>
MAILEROO_USER=<smtp-user>
MAILEROO_PASSWORD=<smtp-pass>
EMAIL_FROM=noreply@yourdomain.com

# Cloudflare R2
R2_ACCOUNT_ID=<account-id>
R2_ACCESS_KEY_ID=<access-key>
R2_SECRET_ACCESS_KEY=<secret-key>
R2_BUCKET_NAME=planday-files
R2_PUBLIC_URL=https://files.yourdomain.com

# FCM (Push Notifications)
FCM_PROJECT_ID=<project-id>
FCM_CLIENT_EMAIL=<service-account-email>
FCM_PRIVATE_KEY=<private-key>
```

**Worker Service:**
```env
# Database & Cache
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Maileroo (same as API)
MAILEROO_API_KEY=<your-api-key>
EMAIL_FROM=noreply@yourdomain.com

# File Storage (same as API)
R2_ACCOUNT_ID=<account-id>
R2_ACCESS_KEY_ID=<access-key>
R2_SECRET_ACCESS_KEY=<secret-key>
R2_BUCKET_NAME=planday-files

# FCM (same as API)
FCM_PROJECT_ID=<project-id>
FCM_CLIENT_EMAIL=<service-account-email>
FCM_PRIVATE_KEY=<private-key>
```

---

## 6. Kosten-Übersicht

### Monatliche Kosten (Production)

#### Small Scale (1000 aktive User):

**SaaS Services:**
```
Clerk:               $45/Monat ($25 + 1000×$0.02)
Maileroo:            $9/Monat (10k Emails)
FCM (Firebase):      $0/Monat (kostenlos)
Cloudflare R2:       $1/Monat (~10 GB)
──────────────────────────────────────
Subtotal SaaS:       $55/Monat
```

**Railway (Infrastructure):**
```
PostgreSQL:          $5-10/Monat
Redis:               $5/Monat
Web (1 Instance):    $5-10/Monat
API (2 Instances):   $10-20/Monat
Worker:              $5-10/Monat
──────────────────────────────────────
Subtotal Railway:    $30-55/Monat
```

**Monitoring (Open Source auf Railway):**
```
Grafana + Prometheus: $5/Monat
Sentry (self-hosted): $5/Monat
Umami Analytics:      $3/Monat
──────────────────────────────────────
Subtotal Monitoring:  $13/Monat
```

**TOTAL Small Scale: $98-123/Monat**

#### Medium Scale (10K User):

**SaaS Services:**
```
Clerk:               $225/Monat ($25 + 10k×$0.02)
Maileroo:            $29/Monat (50k Emails)
FCM:                 $0/Monat
Cloudflare R2:       $5/Monat (~50 GB)
──────────────────────────────────────
Subtotal SaaS:       $259/Monat
```

**Railway:**
```
PostgreSQL:          $20-30/Monat
Redis:               $10-15/Monat
Web (2-3 Instances): $20-40/Monat
API (3-4 Instances): $30-50/Monat
Worker (2):          $10-20/Monat
──────────────────────────────────────
Subtotal Railway:    $90-155/Monat
```

**Monitoring:**
```
Grafana Stack:       $10/Monat
Sentry:              $10/Monat
Umami:               $5/Monat
──────────────────────────────────────
Subtotal:            $25/Monat
```

**TOTAL Medium Scale: $374-439/Monat**

### Vergleich mit Full-SaaS:

**Mit Clerk + SendGrid + DataDog + Mixpanel + AWS:**
- 1K User: ~€500-700/Monat
- 10K User: ~€2.000-3.000/Monat

**Mit unserem Stack (Clerk + Maileroo + Open Source):**
- 1K User: ~€98-123/Monat ✅ **80% günstiger!**
- 10K User: ~€374-439/Monat ✅ **85% günstiger!**

---

## 7. Features - Komplett

### 7.1 Schichtplanung
- ✅ Drag & Drop Schedule Builder
- ✅ Schedule Templates
- ✅ Multi-Location Support
- ✅ Shift Types & Farbcodierung
- ✅ Open Shifts
- ✅ Compliance Warnings (Arbeitszeitgesetz)
- ✅ Conflict Detection
- ✅ Copy/Paste Schedules

### 7.2 Shift Management
- ✅ Shift Swapping (mit Genehmigung)
- ✅ Shift Handover
- ✅ Shift Selling
- ✅ Open Shift Requests
- ✅ Availability Management
- ✅ Time-off Requests

### 7.3 Zeiterfassung
- ✅ Mobile Punch Clock (GPS-basiert)
- ✅ Check-in Fotos
- ✅ Break Tracking
- ✅ Overtime Tracking
- ✅ Timesheet Corrections
- ✅ Attendance Reports

### 7.4 Mitarbeiterverwaltung
- ✅ Employee Profiles (via Clerk)
- ✅ Contract Management
- ✅ Document Management (R2 Storage)
- ✅ Skills & Qualifications
- ✅ Employee Groups/Teams
- ✅ Bulk Import (CSV)

### 7.5 Kommunikation
- ✅ In-App Messaging (Socket.io)
- ✅ Email Notifications (Maileroo)
- ✅ Push Notifications (FCM)
- ✅ SMS (optional via Twilio)
- ✅ News & Announcements
- ✅ Shift Notes

### 7.6 Reporting & Analytics
- ✅ Labor Cost Reports
- ✅ Payroll Reports
- ✅ Attendance Analytics
- ✅ Schedule Efficiency
- ✅ Employee Performance
- ✅ Custom Reports (PDF, Excel export)

### 7.7 Integrationen
- ✅ Payroll (DATEV, Xero, QuickBooks via API)
- ✅ API & Webhooks
- ✅ SSO via Clerk
- ✅ Export Funktionen

### 7.8 Admin & Multi-Tenancy
- ✅ Multi-Tenancy via Clerk Organizations
- ✅ Role-Based Access Control
- ✅ User Management (Clerk Dashboard)
- ✅ Subscription Management (Clerk Billing)
- ✅ Usage Limits per Tier
- ✅ Audit Logs

---

## 8. Entwicklungs-Roadmap

### Phase 1: MVP (3-4 Monate)
- ✅ Clerk Auth & Organizations
- ✅ Basic Scheduling
- ✅ Time Tracking
- ✅ Employee Management
- ✅ Maileroo Email Integration
- ✅ Mobile Apps (Basic)
- ✅ Basic Reporting

### Phase 2: Core Features (2-3 Monate)
- ✅ Shift Swapping
- ✅ Availability Management
- ✅ In-App Messaging
- ✅ Push Notifications
- ✅ Advanced Reporting
- ✅ Clerk Billing Integration

### Phase 3: Advanced Features (2-3 Monate)
- ✅ Schedule Templates
- ✅ Compliance Engine
- ✅ Advanced Analytics (Grafana)
- ✅ Document Management
- ✅ Multi-Location

### Phase 4: Enterprise (2-3 Monate)
- ✅ Payroll Integrations
- ✅ API & Webhooks
- ✅ SSO (via Clerk)
- ✅ White-Label Option
- ✅ Advanced Permissions

**Total: 12 Monate bis Enterprise-Ready**

---

## 9. Pricing-Modell

**Starter**: €2.99/User/Monat
- Basic Scheduling
- Time Tracking
- 1 Location
- Email Support
- 10 Users included

**Plus**: €4.49/User/Monat
- Alles aus Starter
- Shift Swapping
- Advanced Reporting
- 5 Locations
- Payroll Export
- Priority Support
- 25 Users included

**Pro**: €6.99/User/Monat
- Alles aus Plus
- Unlimited Locations
- API Access
- Advanced Analytics
- SSO
- Dedicated Support
- 100 Users included

**Enterprise**: Custom Pricing
- Alles aus Pro
- Custom Integrations
- On-Premise Option
- SLA
- Account Manager
- Unlimited Users

---

## 10. Warum dieser Tech Stack?

### ✅ Vorteile Clerk

1. **Schnellere Time-to-Market** (2-3 Wochen gespart)
2. **Pre-built UI** (Sign-in, Sign-up, User Profile)
3. **Payment Integrated** (kein separates Stripe Setup)
4. **Multi-Tenancy** built-in
5. **Enterprise Features** (SSO, SAML) out-of-the-box
6. **Webhooks** für User-Sync
7. **User Management Dashboard** included

### ✅ Vorteile Maileroo

1. **Günstig** ($9/Monat für 10k Emails)
2. **Hervorragende Deliverability**
3. **EU Server** (GDPR-compliant)
4. **API + SMTP**
5. **Webhooks** (Bounce, Click tracking)
6. **Templates Support**

### ✅ Vorteile Railway

1. **Einfaches Deployment** (Git Push)
2. **Managed Services** (PostgreSQL, Redis)
3. **Auto-Scaling**
4. **SSL automatisch**
5. **Günstiger als Heroku**
6. **Multi-Dockerfile Support**

### ✅ Open Source für Rest

1. **Keine Vendor Lock-ins**
2. **Kosteneffektiv**
3. **Volle Kontrolle**
4. **Community Support**

---

## 11. Zusammenfassung

Du hast jetzt:

✅ **Optimale Balance**: SaaS wo sinnvoll, Open Source wo möglich
✅ **Clerk** für Auth + Payment (schnellere Entwicklung)
✅ **Maileroo** für Emails (günstig & zuverlässig)
✅ **Open Source** für alles andere (PostgreSQL, Redis, Monitoring)
✅ **Railway** für einfaches Hosting
✅ **Komplett kommerziell nutzbar**
✅ **80-85% günstiger** als Full-SaaS
✅ **Neueste Technologien** (Next.js 15, React 19, etc.)

**Kosten:**
- 1K User: ~€100/Monat
- 10K User: ~€400/Monat

**vs. Full-SaaS:**
- 1K User: ~€600/Monat
- 10K User: ~€2.500/Monat

**Ersparnis: €18.000+/Jahr! 💰**

**Viel Erfolg mit deinem Projekt! 🚀**
