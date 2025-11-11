# Contributing to Planday Clone

Thank you for your interest in contributing to Planday Clone! This document provides guidelines and workflows for contributing to the project.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Commit Message Convention](#commit-message-convention)

---

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Standards

**Positive behaviors:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have completed the [Quick Start Guide](./QUICK_START.md) to set up your local development environment.

**Required:**
- Node.js 22.x LTS
- pnpm 9.x
- PostgreSQL 17
- Redis 7.4
- Git

### Fork and Clone

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/YOUR_USERNAME/quantumshiftplanner.git
cd quantumshiftplanner

# Add upstream remote
git remote add upstream https://github.com/original/quantumshiftplanner.git

# Verify remotes
git remote -v
```

### Setup Development Environment

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:migrate

# Start development servers
pnpm dev
```

---

## 🔄 Development Workflow

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bugfixes
git checkout -b fix/issue-number-description
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

**Examples:**
```
feature/shift-swap-approval
fix/1234-timezone-bug
docs/api-reference-update
refactor/auth-guard-cleanup
test/shift-service-unit-tests
chore/upgrade-dependencies
```

### 2. Make Changes

**Follow these principles:**

✅ **DO:**
- Write clean, readable code
- Add comments for complex logic
- Update documentation if needed
- Write tests for new features
- Keep commits atomic and focused

❌ **DON'T:**
- Mix multiple unrelated changes
- Commit directly to `main`
- Include unnecessary files
- Leave commented-out code
- Commit secrets or credentials

### 3. Test Your Changes

```bash
# Run all tests
pnpm test

# Run specific tests
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run linter
pnpm lint

# Fix linting issues
pnpm lint --fix

# Type check
pnpm type-check

# Test in development mode
pnpm dev
```

### 4. Commit Changes

Follow our [Commit Message Convention](#commit-message-convention).

```bash
# Stage changes
git add .

# Commit with conventional message
git commit -m "feat(shifts): add shift swap approval flow

- Add approval workflow for shift swaps
- Implement manager notification
- Add unit tests for approval logic

Closes #123"
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Use the PR template (auto-populated)
```

---

## 📝 Coding Standards

### TypeScript

**Use strict TypeScript:**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}

function getUser(id: string): Promise<User | null> {
  // Implementation
}

// ❌ Bad
function getUser(id: any): any {
  // Implementation
}
```

**Prefer interfaces over types for objects:**
```typescript
// ✅ Good
interface UserProps {
  name: string;
  email: string;
}

// ⚠️ OK for unions/intersections
type Status = 'active' | 'inactive' | 'pending';
```

### Naming Conventions

```typescript
// Variables & functions: camelCase
const userName = 'John';
function getUserById() {}

// Classes & Components: PascalCase
class UserService {}
function UserProfile() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// Private members: prefix with _
class Service {
  private _cache: Map<string, any>;
}

// Files:
// - Components: PascalCase (UserProfile.tsx)
// - Utilities: camelCase (dateUtils.ts)
// - Config: kebab-case (next.config.ts)
```

### React/Next.js

**Use functional components with hooks:**
```typescript
// ✅ Good
export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser(userId).then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}

// ❌ Bad (class components)
export class UserProfile extends React.Component {
  // ...
}
```

**Prefer server components when possible:**
```typescript
// ✅ Good (Server Component)
export default async function Page() {
  const data = await fetch('...');
  return <div>{data}</div>;
}

// ⚠️ Only use 'use client' when necessary
'use client';
export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### NestJS

**Use decorators and dependency injection:**
```typescript
// ✅ Good
@Injectable()
export class ShiftsService {
  constructor(
    @Inject('SHIFTS_REPOSITORY')
    private shiftsRepository: Repository<Shift>,
    private readonly logger: Logger,
  ) {}

  async findAll(): Promise<Shift[]> {
    return this.shiftsRepository.find();
  }
}

// ❌ Bad (direct instantiation)
export class ShiftsService {
  private repository = new ShiftsRepository();
}
```

### Code Style

We use **Prettier** for formatting. Configuration in `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

**Run formatter:**
```bash
pnpm format
```

---

## 🧪 Testing Requirements

### Testing Philosophy

- **Unit tests**: Test individual functions/methods in isolation
- **Integration tests**: Test multiple components working together
- **E2E tests**: Test complete user flows

### Coverage Requirements

- Minimum 70% overall coverage
- Minimum 80% for critical paths (auth, payments, data integrity)
- 100% for security-critical code

### Writing Tests

**Unit Tests (Vitest):**
```typescript
// apps/api/src/shifts/shifts.service.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ShiftsService } from './shifts.service';

describe('ShiftsService', () => {
  let service: ShiftsService;

  beforeEach(() => {
    service = new ShiftsService(mockDb);
  });

  it('should create a shift', async () => {
    const shift = await service.create({
      employeeId: '123',
      startTime: new Date('2025-12-01T09:00:00Z'),
      endTime: new Date('2025-12-01T17:00:00Z'),
    });

    expect(shift).toBeDefined();
    expect(shift.employeeId).toBe('123');
  });

  it('should throw error on conflicting shifts', async () => {
    await service.create({
      employeeId: '123',
      startTime: new Date('2025-12-01T09:00:00Z'),
      endTime: new Date('2025-12-01T17:00:00Z'),
    });

    await expect(
      service.create({
        employeeId: '123',
        startTime: new Date('2025-12-01T10:00:00Z'),
        endTime: new Date('2025-12-01T18:00:00Z'),
      })
    ).rejects.toThrow('Shift conflict');
  });
});
```

**E2E Tests (Playwright):**
```typescript
// e2e/shifts.spec.ts
import { test, expect } from '@playwright/test';

test('manager can create shift', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'manager@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  await page.goto('/shifts/new');
  await page.selectOption('[name="employee"]', 'employee-123');
  await page.fill('[name="startTime"]', '2025-12-01T09:00');
  await page.fill('[name="endTime"]', '2025-12-01T17:00');
  await page.click('button[type="submit"]');

  await expect(page.locator('.success-toast')).toBeVisible();
  await expect(page).toHaveURL(/\/shifts\/\w+/);
});
```

### Run Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Specific file
pnpm test shifts.spec.ts
```

---

## 🔀 Pull Request Process

### Before Creating PR

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Linter passes
- [ ] Type check passes
- [ ] Documentation updated (if needed)
- [ ] Changelog updated (for significant changes)

### PR Template

When creating a PR, the template will be auto-populated. Fill it out completely:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Commented complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added
- [ ] All tests pass
```

### PR Guidelines

**Good PRs:**
- ✅ Focus on single concern
- ✅ Have clear title and description
- ✅ Include tests
- ✅ Keep diffs small (< 500 lines preferred)
- ✅ Update documentation
- ✅ Have meaningful commit messages

**Avoid:**
- ❌ Multiple unrelated changes
- ❌ Large refactors + new features
- ❌ Missing tests
- ❌ Broken tests
- ❌ Uncommitted changes
- ❌ Merge commits (use rebase)

### Review Process

1. **Automated Checks** (1-2 minutes)
   - Tests run
   - Linter runs
   - Type check runs
   - Security scan runs

2. **Code Review** (1-3 days)
   - At least 1 reviewer approval required
   - Address all comments
   - Make requested changes

3. **Merge** (after approval)
   - Squash and merge (default)
   - Delete branch after merge

---

## 🐛 Issue Guidelines

### Before Creating an Issue

1. Search existing issues
2. Check documentation
3. Try latest version
4. Prepare reproduction steps

### Issue Templates

**Bug Report:**
```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., macOS 14.1]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

**Feature Request:**
```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of what you want

**Describe alternatives you've considered**
Other solutions you've thought about

**Additional context**
Any other relevant information
```

---

## 📝 Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
# Simple feature
feat(shifts): add shift swap functionality

# Bug fix with issue number
fix(auth): resolve token expiration bug

Fixes authentication token not refreshing properly
when user session exceeds 1 hour.

Closes #456

# Breaking change
feat(api)!: change shift API response format

BREAKING CHANGE: Shift API now returns ISO 8601 dates
instead of Unix timestamps. Update clients accordingly.

# Multiple changes
feat(shifts): implement shift approval workflow

- Add approval status to shift model
- Implement manager approval endpoint
- Add email notifications for approvals
- Update UI to show approval status

Closes #123, #124
```

---

## 🏗️ Project Structure

```
quantumshiftplanner/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # NestJS backend
│   ├── worker/       # Background jobs
│   └── mobile/       # React Native app
├── packages/
│   ├── database/     # Database schema & migrations
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configuration
├── docs/             # Additional documentation
├── e2e/              # End-to-end tests
└── scripts/          # Build & deployment scripts
```

---

## 🎯 Areas to Contribute

### Good First Issues

Look for issues labeled `good first issue` - these are great for newcomers!

### High Priority Areas

1. **Testing**: Improve test coverage
2. **Documentation**: Improve docs and add examples
3. **Performance**: Optimize slow queries/components
4. **Accessibility**: Improve a11y compliance
5. **i18n**: Add translations
6. **Mobile**: Improve mobile app features

### Feature Requests

Check the [roadmap](./README.md#roadmap) for planned features.

---

## ❓ Questions?

- **Discord**: Join our development Discord
- **Discussions**: Use GitHub Discussions
- **Email**: dev@yourdomain.com

---

## 📚 Additional Resources

- [Quick Start Guide](./QUICK_START.md)
- [API Reference](./API_REFERENCE.md)
- [Architecture Overview](./CONCEPT.md)
- [Security Policy](./SECURITY.md)

---

Thank you for contributing! 🎉

**Last Updated:** November 2025
