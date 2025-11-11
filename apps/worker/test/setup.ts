import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/planday_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.CLERK_SECRET_KEY = 'sk_test_mock_key_for_testing';
process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_mock_key_for_testing';

// Mock external dependencies
vi.mock('dotenv/config', () => ({}));

// Mock BullMQ Worker
vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Job: vi.fn(),
}));

// Mock IORedis
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  })),
}));
