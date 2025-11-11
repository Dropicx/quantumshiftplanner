# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

We take the security of Planday Clone seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please DO NOT:
- ❌ Open a public GitHub issue
- ❌ Disclose the vulnerability publicly before it has been addressed
- ❌ Exploit the vulnerability beyond what is necessary to demonstrate it

### Please DO:
- ✅ Report via email to: **security@yourdomain.com**
- ✅ Include detailed steps to reproduce the vulnerability
- ✅ Allow reasonable time for us to respond before public disclosure
- ✅ Make a good faith effort to avoid privacy violations, data destruction, and service interruption

---

## Reporting Process

### 1. Send Report

Email **security@yourdomain.com** with:

```
Subject: [SECURITY] Brief description

Body:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information (optional but helpful)
```

### 2. Acknowledgment

- We will acknowledge receipt within **48 hours**
- We will provide an estimated timeline for a fix
- We will keep you updated on our progress

### 3. Fix & Disclosure

- We aim to patch critical vulnerabilities within **7 days**
- Medium-risk vulnerabilities within **30 days**
- Low-risk vulnerabilities within **90 days**

### 4. Recognition

- We maintain a Security Hall of Fame
- Contributors will be publicly recognized (unless you prefer to remain anonymous)
- No monetary rewards at this time (we're open source!)

---

## Security Best Practices

### For Contributors

#### Code Review
- All code changes require review from at least one maintainer
- Security-sensitive changes require review from two maintainers
- Automated security scans must pass before merge

#### Dependencies
- Keep dependencies up to date
- Review dependency licenses
- Use `pnpm audit` regularly
- Never commit credentials or secrets

#### Testing
- Write tests for security-critical code
- Include security tests in your PRs
- Test authentication and authorization flows
- Test input validation

### For Deployments

#### Environment Variables
```bash
# ❌ NEVER commit these
- API keys
- Database passwords
- JWT secrets
- OAuth secrets
- Encryption keys

# ✅ Use environment variables
- Store in .env files (gitignored)
- Use Railway/Vercel environment variables
- Rotate secrets regularly
```

#### Database Security
```bash
# ✅ Production best practices
- Use strong passwords (32+ characters)
- Enable SSL/TLS for connections
- Restrict network access (firewall rules)
- Regular backups
- Enable audit logging
- Use read replicas for reporting
```

#### API Security
```bash
# ✅ Implemented in this project
- Rate limiting (100 req/min per user)
- CORS restrictions
- Request size limits
- Input validation (Zod)
- SQL injection prevention (Drizzle ORM)
- XSS prevention (React automatic escaping)
- CSRF protection (SameSite cookies)
```

---

## Security Features

### Authentication & Authorization
- ✅ Clerk-managed authentication
- ✅ JWT token verification
- ✅ Session management
- ✅ Multi-factor authentication (MFA)
- ✅ Role-based access control (RBAC)
- ✅ Organization-level isolation

### Data Protection
- ✅ HTTPS/TLS everywhere
- ✅ Database encryption at rest
- ✅ Secure password hashing (Clerk-managed)
- ✅ PII data encryption
- ✅ GDPR compliance features

### Application Security
- ✅ Input validation (Zod schemas)
- ✅ Output encoding
- ✅ SQL injection prevention (ORM)
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Security headers (Helmet.js)

### Infrastructure Security
- ✅ Regular security updates
- ✅ Automated vulnerability scanning
- ✅ DDoS protection (Cloudflare)
- ✅ WAF (Web Application Firewall)
- ✅ Audit logging

---

## Common Vulnerabilities

### We Protect Against:

#### 1. SQL Injection
```typescript
// ❌ NEVER DO THIS
db.query(`SELECT * FROM users WHERE email = '${userInput}'`);

// ✅ ALWAYS DO THIS (using Drizzle ORM)
db.select().from(users).where(eq(users.email, userInput));
```

#### 2. XSS (Cross-Site Scripting)
```typescript
// ❌ NEVER DO THIS
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ✅ ALWAYS DO THIS (React auto-escapes)
<div>{userInput}</div>

// ✅ If you need HTML, sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(userInput)}} />
```

#### 3. Authentication Bypass
```typescript
// ❌ NEVER DO THIS
if (req.headers.userId === 'admin') {
  // Grant admin access
}

// ✅ ALWAYS DO THIS (verify JWT)
const { userId, orgId } = await auth();
const user = await db.query.users.findFirst({
  where: eq(users.clerkUserId, userId)
});
```

#### 4. Insecure Direct Object References (IDOR)
```typescript
// ❌ NEVER DO THIS
@Get(':id')
async getShift(@Param('id') id: string) {
  return this.shiftsService.findOne(id);
}

// ✅ ALWAYS DO THIS (check ownership)
@Get(':id')
async getShift(@Param('id') id: string, @CurrentUser() user: any) {
  const shift = await this.shiftsService.findOne(id);

  if (shift.organizationId !== user.orgId) {
    throw new ForbiddenException();
  }

  return shift;
}
```

#### 5. Mass Assignment
```typescript
// ❌ NEVER DO THIS
@Post()
async createUser(@Body() userData: any) {
  return db.insert(users).values(userData);
}

// ✅ ALWAYS DO THIS (use DTOs)
@Post()
async createUser(@Body() createUserDto: CreateUserDto) {
  return db.insert(users).values({
    email: createUserDto.email,
    firstName: createUserDto.firstName,
    lastName: createUserDto.lastName,
    // Only allow specific fields
  });
}
```

---

## Security Checklist

### Before Every Release

- [ ] All dependencies updated
- [ ] `pnpm audit` shows no high/critical vulnerabilities
- [ ] Security tests pass
- [ ] No hardcoded secrets in code
- [ ] Environment variables properly configured
- [ ] HTTPS enabled on all endpoints
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Audit logging enabled
- [ ] Backup system functional
- [ ] Monitoring alerts configured

### For New Features

- [ ] Input validation implemented
- [ ] Output encoding implemented
- [ ] Authorization checks in place
- [ ] Audit logging added
- [ ] Security tests written
- [ ] Peer reviewed by security-aware developer

---

## Incident Response Plan

### If a Security Breach Occurs:

1. **Immediate Actions** (0-1 hour)
   - Contain the breach
   - Stop further data loss
   - Document everything
   - Notify security team

2. **Short-term Actions** (1-24 hours)
   - Assess the damage
   - Identify affected users
   - Apply emergency patches
   - Reset compromised credentials

3. **Communication** (24-48 hours)
   - Notify affected users
   - Public disclosure (if required)
   - Regulatory reporting (GDPR, etc.)

4. **Recovery** (48+ hours)
   - Implement permanent fixes
   - Enhanced monitoring
   - Security audit
   - Post-mortem analysis

---

## Security Tools

### Development

```bash
# Dependency scanning
pnpm audit
pnpm audit --fix

# SAST (Static Application Security Testing)
npm install -g @microsoft/eslint-plugin-sdl
eslint . --ext .ts,.tsx

# Secret scanning
npm install -g git-secrets
git secrets --scan
```

### CI/CD Integration

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'

      - name: Run npm audit
        run: pnpm audit --audit-level=high
```

### Production Monitoring

- **Sentry** - Error tracking and performance
- **Grafana** - Security metrics dashboard
- **Fail2ban** - Intrusion prevention
- **Cloudflare** - DDoS protection

---

## Security Headers

### Implemented Headers

```typescript
// apps/web/next.config.ts
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self' data:;
      connect-src 'self' https://*.clerk.com https://*.railway.app;
      frame-src 'self' https://*.clerk.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

---

## Rate Limiting

### API Endpoints

```typescript
// Configured in apps/api/src/main.ts
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot([
  {
    ttl: 60000, // 1 minute
    limit: 100, // 100 requests per minute
  },
]);
```

### Specific Endpoints

```typescript
// Custom rate limits for sensitive endpoints
@Controller('auth')
export class AuthController {
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests/minute
  @Post('login')
  async login() {
    // ...
  }
}
```

---

## Data Encryption

### In Transit
- All traffic uses HTTPS/TLS 1.3
- SSL certificates from Let's Encrypt
- HSTS headers enforce HTTPS

### At Rest
- Database: PostgreSQL with encryption enabled
- File storage: Cloudflare R2 with server-side encryption
- Backups: Encrypted with AES-256

### PII Data
- Email addresses: Stored as-is (required for communication)
- Phone numbers: Optional, encrypted if provided
- Passwords: Managed by Clerk (bcrypt hashing)
- Payment info: Never stored (handled by Stripe via Clerk)

---

## Compliance

### GDPR
- Right to access (data export)
- Right to deletion (soft delete + anonymization)
- Right to rectification (profile updates)
- Data portability (JSON export)
- Consent management
- Privacy by design

### SOC 2 (Future)
- Access controls
- Encryption
- Monitoring & logging
- Incident response
- Vendor management

---

## Security Contacts

- **Email:** security@yourdomain.com
- **PGP Key:** [Link to public key]
- **Response Time:** Within 48 hours
- **Escalation:** CTO at cto@yourdomain.com

---

## Hall of Fame

We recognize and thank the following security researchers:

| Date | Researcher | Vulnerability |
|------|-----------|---------------|
| TBD  | -         | -             |

---

## Updates to This Policy

This security policy is reviewed and updated quarterly.

**Last Updated:** November 2025
**Next Review:** February 2026

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

Thank you for helping keep Planday Clone secure! 🔒
