# Authentication Flow - Clerk Integration Guide

Complete guide to implementing authentication across Web, API, and Mobile platforms using Clerk.

---

## 🎯 Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clerk Service                         │
│  - User Management                                           │
│  - Session Management                                        │
│  - JWT Token Generation                                      │
│  - OAuth Providers                                           │
│  - Multi-Factor Authentication                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬────────────────┐
        │                     │                 │
┌───────▼─────────┐   ┌───────▼──────┐   ┌────▼────────────┐
│   Next.js Web   │   │  NestJS API  │   │  React Native   │
│                 │   │              │   │     Mobile      │
│ - Clerk SDK     │   │ - JWT Verify │   │  - Clerk SDK    │
│ - Middleware    │   │ - Guards     │   │  - Expo Auth    │
│ - Components    │   │ - Decorators │   │  - Deep Links   │
└─────────────────┘   └──────────────┘   └─────────────────┘
```

---

## 📱 Web Application (Next.js)

### 1. Installation

```bash
cd apps/web
pnpm add @clerk/nextjs
```

### 2. Environment Setup

```env
# apps/web/.env.local

# Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Optional: Clerk domain (for production)
NEXT_PUBLIC_CLERK_DOMAIN=accounts.yourdomain.com
```

### 3. Root Layout Setup

```typescript
// apps/web/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { deDE } from '@clerk/localizations';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      localization={deDE}
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
          card: 'shadow-lg',
        },
      }}
    >
      <html lang="de">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### 4. Middleware for Route Protection

```typescript
// apps/web/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health',
]);

// Define organization-required routes
const requiresOrganization = createRouteMatcher([
  '/dashboard(.*)',
  '/shifts(.*)',
  '/employees(.*)',
  '/schedule(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, orgId } = await auth();

  // Allow public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Protect all other routes
  if (!userId) {
    return auth.redirectToSignIn();
  }

  // Check organization requirement
  if (requiresOrganization(request) && !orgId) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### 5. Authentication Pages

**Sign In Page:**
```typescript
// apps/web/app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl',
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
```

**Sign Up Page:**
```typescript
// apps/web/app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-xl',
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </div>
  );
}
```

### 6. Organization Management

**Onboarding (Create/Join Organization):**
```typescript
// apps/web/app/onboarding/page.tsx
import { auth } from '@clerk/nextjs/server';
import { CreateOrganization } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const { userId, orgId } = await auth();

  if (!userId) redirect('/sign-in');
  if (orgId) redirect('/dashboard');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Willkommen!</h1>
          <p className="mt-2 text-gray-600">
            Erstellen Sie Ihre Organisation oder treten Sie einer bestehenden bei.
          </p>
        </div>

        <CreateOrganization
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-xl',
            },
          }}
          afterCreateOrganizationUrl="/dashboard"
        />
      </div>
    </div>
  );
}
```

**Organization Switcher:**
```typescript
// apps/web/components/OrganizationSwitcher.tsx
'use client';

import { OrganizationSwitcher as ClerkOrgSwitcher } from '@clerk/nextjs';

export function OrganizationSwitcher() {
  return (
    <ClerkOrgSwitcher
      hidePersonal
      appearance={{
        elements: {
          rootBox: 'flex items-center',
          organizationSwitcherTrigger: 'px-4 py-2 border rounded-lg hover:bg-gray-50',
        },
      }}
      afterCreateOrganizationUrl="/dashboard"
      afterSelectOrganizationUrl="/dashboard"
    />
  );
}
```

### 7. User Menu

```typescript
// apps/web/components/UserMenu.tsx
'use client';

import { UserButton } from '@clerk/nextjs';

export function UserMenu() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: 'w-10 h-10',
        },
      }}
      afterSignOutUrl="/"
      userProfileMode="modal"
      userProfileProps={{
        appearance: {
          elements: {
            rootBox: 'w-full',
            card: 'shadow-xl',
          },
        },
      }}
    />
  );
}
```

### 8. Server-Side Authentication

**In Server Components:**
```typescript
// apps/web/app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) redirect('/sign-in');
  if (!orgId) redirect('/onboarding');

  // Get full user object
  const user = await currentUser();

  // Get user's role in organization
  const { has } = await auth();
  const isAdmin = has({ role: 'org:admin' });
  const isManager = has({ role: 'org:manager' });

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <p>Organization ID: {orgId}</p>
      {isAdmin && <p>You are an admin</p>}
    </div>
  );
}
```

**In API Routes:**
```typescript
// apps/web/app/api/example/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ userId, orgId });
}
```

### 9. Client-Side Authentication

```typescript
// apps/web/components/ClientComponent.tsx
'use client';

import { useAuth, useUser, useOrganization } from '@clerk/nextjs';
import { useEffect } from 'react';

export function ClientComponent() {
  const { isLoaded, userId, orgId, getToken } = useAuth();
  const { user } = useUser();
  const { organization } = useOrganization();

  useEffect(() => {
    async function makeAuthenticatedRequest() {
      const token = await getToken();

      const response = await fetch('/api/protected', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log(data);
    }

    if (userId) {
      makeAuthenticatedRequest();
    }
  }, [userId, getToken]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div>
      <p>User ID: {userId}</p>
      <p>Email: {user?.emailAddresses[0].emailAddress}</p>
      <p>Organization: {organization?.name}</p>
    </div>
  );
}
```

---

## 🖥️ API Backend (NestJS)

### 1. Installation

```bash
cd apps/api
pnpm add @clerk/clerk-sdk-node @clerk/backend
```

### 2. Environment Setup

```env
# apps/api/.env
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

### 3. Clerk Module Setup

```typescript
// apps/api/src/clerk/clerk.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClerkClient } from '@clerk/clerk-sdk-node';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'CLERK_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new ClerkClient({
          secretKey: configService.get('CLERK_SECRET_KEY'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['CLERK_CLIENT'],
})
export class ClerkModule {}
```

### 4. JWT Authentication Guard

```typescript
// apps/api/src/auth/guards/clerk-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: this.configService.get('CLERK_SECRET_KEY'),
      });

      request.user = {
        id: payload.sub,
        clerk UserId: payload.sub,
        orgId: payload.org_id,
        role: payload.org_role,
        permissions: payload.org_permissions || [],
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### 5. Organization Guard

```typescript
// apps/api/src/auth/guards/organization.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.orgId) {
      throw new ForbiddenException('User must belong to an organization');
    }

    // Optionally check specific organization
    const requiredOrgId = this.reflector.get<string>('orgId', context.getHandler());
    if (requiredOrgId && user.orgId !== requiredOrgId) {
      throw new ForbiddenException('User does not belong to the required organization');
    }

    return true;
  }
}
```

### 6. Roles Guard

```typescript
// apps/api/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException(`User must have one of the following roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
```

### 7. Decorators

```typescript
// apps/api/src/auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);
```

```typescript
// apps/api/src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

```typescript
// apps/api/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

### 8. Controller Implementation

```typescript
// apps/api/src/shifts/shifts.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('shifts')
@UseGuards(ClerkAuthGuard, OrganizationGuard, RolesGuard)
export class ShiftsController {
  // Public endpoint (no auth required)
  @Public()
  @Get('public')
  getPublicShifts() {
    return { message: 'Public shifts' };
  }

  // Protected endpoint (requires auth)
  @Get()
  getShifts(@CurrentUser() user: any) {
    return {
      message: 'User shifts',
      userId: user.id,
      orgId: user.orgId,
    };
  }

  // Admin-only endpoint
  @Post()
  @Roles('org:admin', 'org:manager')
  createShift(@CurrentUser() user: any, @Body() createShiftDto: any) {
    return {
      message: 'Shift created',
      createdBy: user.id,
    };
  }
}
```

### 9. Global Guards Setup

```typescript
// apps/api/src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClerkAuthGuard } from './auth/guards/clerk-auth.guard';
import { OrganizationGuard } from './auth/guards/organization.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get services from DI container
  const reflector = app.get(Reflector);
  const configService = app.get(ConfigService);

  // Apply guards globally
  app.useGlobalGuards(
    new ClerkAuthGuard(reflector, configService),
    new OrganizationGuard(reflector),
    new RolesGuard(reflector),
  );

  await app.listen(3001);
}
bootstrap();
```

### 10. Clerk Webhooks

```typescript
// apps/api/src/webhooks/clerk.controller.ts
import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { Webhook } from 'svix';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import { UsersService } from '../users/users.service';

@Controller('webhooks/clerk')
export class ClerkWebhookController {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Post()
  async handleWebhook(
    @Body() body: any,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const webhookSecret = this.configService.get('CLERK_WEBHOOK_SECRET');
    const wh = new Webhook(webhookSecret);

    let evt;
    try {
      evt = wh.verify(JSON.stringify(body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      throw new BadRequestException('Webhook verification failed');
    }

    const eventType = evt.type;

    switch (eventType) {
      case 'user.created':
        await this.usersService.createFromClerk(evt.data);
        break;

      case 'user.updated':
        await this.usersService.updateFromClerk(evt.data);
        break;

      case 'user.deleted':
        await this.usersService.deleteFromClerk(evt.data.id);
        break;

      case 'organization.created':
        await this.usersService.createOrganizationFromClerk(evt.data);
        break;

      case 'organizationMembership.created':
        await this.usersService.addMemberToOrganization(evt.data);
        break;

      case 'organizationMembership.deleted':
        await this.usersService.removeMemberFromOrganization(evt.data);
        break;
    }

    return { success: true };
  }
}
```

---

## 📱 Mobile Application (React Native + Expo)

### 1. Installation

```bash
cd apps/mobile
pnpm add @clerk/clerk-expo expo-web-browser expo-auth-session react-native-mmkv
```

### 2. Clerk Setup

```typescript
// apps/mobile/App.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from './lib/tokenCache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootNavigator />
    </ClerkProvider>
  );
}
```

### 3. Token Cache (Secure Storage)

```typescript
// apps/mobile/lib/tokenCache.ts
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const tokenCache = {
  async getToken(key: string) {
    try {
      return storage.getString(key) ?? null;
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      storage.set(key, value);
    } catch (err) {
      return;
    }
  },
};
```

### 4. Authentication Screens

**Sign In:**
```typescript
// apps/mobile/screens/SignInScreen.tsx
import { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';

export function SignInScreen({ navigation }) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigation.replace('Dashboard');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Sign In</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />

      <Button title="Sign In" onPress={onSignInPress} />

      <Button
        title="Don't have an account? Sign Up"
        onPress={() => navigation.navigate('SignUp')}
      />
    </View>
  );
}
```

### 5. OAuth (Google, Apple)

```typescript
// apps/mobile/screens/SignInWithOAuth.tsx
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { Button } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export function SignInWithOAuth() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const onPress = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error('OAuth error', err);
    }
  };

  return <Button title="Sign in with Google" onPress={onPress} />;
}
```

### 6. Protected Navigation

```typescript
// apps/mobile/navigation/RootNavigator.tsx
import { useAuth } from '@clerk/clerk-expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isSignedIn ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Shifts" component={ShiftsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 7. API Calls with Auth Token

```typescript
// apps/mobile/lib/api.ts
import { useAuth } from '@clerk/clerk-expo';

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  return authFetch;
}
```

**Usage:**
```typescript
// apps/mobile/screens/ShiftsScreen.tsx
import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../lib/api';

export function ShiftsScreen() {
  const authFetch = useAuthenticatedFetch();
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    async function loadShifts() {
      const data = await authFetch('https://api.yourdomain.com/shifts');
      setShifts(data);
    }

    loadShifts();
  }, []);

  return (
    // Render shifts...
  );
}
```

---

## 🔒 Security Best Practices

### 1. Token Expiration

```typescript
// Clerk tokens expire after 1 hour by default
// Tokens are automatically refreshed by Clerk SDK

// Manual refresh if needed
const { getToken } = useAuth();
const token = await getToken({ skipCache: true });
```

### 2. Session Management

```typescript
// Sign out user
const { signOut } = useAuth();
await signOut();

// Get all sessions
const { sessions } = useAuth();

// Revoke specific session
await clerkClient.sessions.revokeSession(sessionId);
```

### 3. Organization Permissions

```typescript
// Check permissions in frontend
const { has } = useAuth();

if (has({ permission: 'org:shift:create' })) {
  // Show create shift button
}

// Check in backend
if (user.permissions.includes('org:shift:create')) {
  // Allow shift creation
}
```

---

## 📊 User Sync Strategy

### Database Schema for User Sync

Already defined in `CONCEPT.md` - users table with `clerkUserId` field.

### Sync on Webhook

```typescript
// apps/api/src/users/users.service.ts
async createFromClerk(clerkUser: any) {
  await db.insert(users).values({
    clerkUserId: clerkUser.id,
    email: clerkUser.email_addresses[0].email_address,
    firstName: clerkUser.first_name,
    lastName: clerkUser.last_name,
    avatarUrl: clerkUser.image_url,
  });
}
```

---

## 🧪 Testing Authentication

### Unit Tests

```typescript
// Mock Clerk in tests
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => ({ userId: 'user_123', orgId: 'org_456' })),
  currentUser: jest.fn(() => ({
    id: 'user_123',
    firstName: 'John',
    lastName: 'Doe',
  })),
}));
```

### E2E Tests

```typescript
// apps/web/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign in', async ({ page }) => {
  await page.goto('/sign-in');
  await page.fill('input[name="identifier"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 🔄 Token Refresh Flow

```typescript
// Automatic refresh by Clerk SDK
// No manual implementation needed

// Frontend: Token is auto-refreshed before expiry
const { getToken } = useAuth();
const token = await getToken(); // Always fresh

// Backend: Just verify token
// Clerk handles refresh on client side
```

---

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [React Native Integration](https://clerk.com/docs/quickstarts/expo)

---

**Last Updated:** November 2025
**Maintained by:** Development Team
