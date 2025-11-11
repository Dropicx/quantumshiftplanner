import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Env } from '@planday/config';

import { HealthService } from './health.service';

// Mock dependencies
vi.mock('@planday/database', () => ({
  getDatabase: vi.fn().mockReturnValue({
    execute: vi.fn().mockResolvedValue([] as never),
  }),
}));

vi.mock('@planday/config', () => ({
  validateEnv: vi.fn().mockReturnValue({
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    CLERK_SECRET_KEY: 'sk_test_123',
    CLERK_PUBLISHABLE_KEY: 'pk_test_123',
    LOG_LEVEL: 'info',
  } as Env),
}));

// Mock ioredis
const mockPing = vi.fn().mockResolvedValue('PONG');
const mockDisconnect = vi.fn().mockResolvedValue(undefined);

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    ping: mockPing,
    disconnect: mockDisconnect,
  })),
}));

describe('HealthService', () => {
  let service: HealthService;
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset mocks to default behavior
    mockPing.mockResolvedValue('PONG');
    mockDisconnect.mockResolvedValue(undefined);

    const { getDatabase } = await import('@planday/database');
    const mockDb = getDatabase();
    vi.mocked(mockDb.execute).mockResolvedValue([] as never);

    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.CLERK_SECRET_KEY = 'sk_test_123';
    process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_123';

    service = new HealthService();
  });

  afterEach(() => {
    process.env = originalEnv;
    if (service) {
      service.onModuleDestroy();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkDatabase', () => {
    it('should return healthy status when database is accessible', async () => {
      const result = await service.checkDatabase();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Database connection is healthy');
      expect(result.responseTime).toBeDefined();
      expect(typeof result.responseTime).toBe('number');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy status when database is not accessible', async () => {
      const { getDatabase } = await import('@planday/database');
      const mockDb = getDatabase();

      vi.mocked(mockDb.execute).mockRejectedValueOnce(
        new Error('Connection refused'),
      );

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Connection refused');
      expect(result.responseTime).toBeDefined();
    });

    it('should measure response time', async () => {
      const { getDatabase } = await import('@planday/database');
      const mockDb = getDatabase();

      // Add a small delay to measure
      vi.mocked(mockDb.execute).mockImplementation(
        (() =>
          new Promise((resolve) =>
            setTimeout(() => resolve([] as never), 10),
          )) as never,
      );

      const result = await service.checkDatabase();

      // Response time should be at least close to 10ms (allow for some timing variance)
      expect(result.responseTime).toBeGreaterThanOrEqual(8);
    });
  });

  describe('checkRedis', () => {
    it('should return healthy status when Redis is accessible', async () => {
      const result = await service.checkRedis();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Redis connection is healthy');
      expect(result.responseTime).toBeDefined();
      expect(typeof result.responseTime).toBe('number');
    });

    it('should return healthy status when Redis is not configured', async () => {
      const { validateEnv } = await import('@planday/config');

      // Mock for both constructor and checkRedis calls
      vi.mocked(validateEnv).mockReturnValue({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        REDIS_URL: '',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
        LOG_LEVEL: 'info',
      } as Env);

      const serviceWithoutRedis = new HealthService();
      const result = await serviceWithoutRedis.checkRedis();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Redis is not configured (optional)');
      expect(result.responseTime).toBeUndefined();

      // Restore default mock
      vi.mocked(validateEnv).mockReturnValue({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        REDIS_URL: 'redis://localhost:6379',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
        LOG_LEVEL: 'info',
      } as Env);
    });

    it('should return unhealthy status when Redis ping fails', async () => {
      mockPing.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await service.checkRedis();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Connection refused');
      expect(result.responseTime).toBeDefined();
    });

    it('should timeout if Redis ping takes too long', async () => {
      mockPing.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('PONG'), 6000)),
      );

      const result = await service.checkRedis();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('timeout');
    });

    it('should return unhealthy if ping returns unexpected result', async () => {
      mockPing.mockResolvedValueOnce('UNEXPECTED');

      const result = await service.checkRedis();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('unexpected result');
    });
  });

  describe('checkOverallHealth', () => {
    it('should return healthy when all services are healthy', async () => {
      const result = await service.checkOverallHealth();

      expect(result.status).toBe('healthy');
      expect(result.database.status).toBe('healthy');
      expect(result.redis.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should return unhealthy when database is unhealthy', async () => {
      const { getDatabase } = await import('@planday/database');
      const mockDb = getDatabase();

      vi.mocked(mockDb.execute).mockRejectedValueOnce(new Error('DB error'));

      const result = await service.checkOverallHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.database.status).toBe('unhealthy');
    });

    it('should return unhealthy when Redis is unhealthy', async () => {
      mockPing.mockRejectedValueOnce(new Error('Redis error'));

      const result = await service.checkOverallHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.redis.status).toBe('unhealthy');
    });

    it('should check database and Redis in parallel', async () => {
      const { getDatabase } = await import('@planday/database');
      const mockDb = getDatabase();

      let dbStartTime = 0;
      let redisStartTime = 0;

      vi.mocked(mockDb.execute).mockImplementation((async () => {
        dbStartTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 50));
        return [] as never;
      }) as never);

      mockPing.mockImplementation(async () => {
        redisStartTime = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'PONG';
      });

      const startTime = Date.now();
      await service.checkOverallHealth();
      const totalTime = Date.now() - startTime;

      // If they run in parallel, total time should be less than sum of individual times
      expect(totalTime).toBeLessThan(150); // Should be ~50ms not 100ms
      expect(Math.abs(dbStartTime - redisStartTime)).toBeLessThan(10); // Started almost simultaneously
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect Redis client', () => {
      service.onModuleDestroy();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple destroy calls', () => {
      service.onModuleDestroy();
      service.onModuleDestroy();

      // Should only disconnect once since client is set to null after first call
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle destroy when Redis is not configured', async () => {
      const { validateEnv } = await import('@planday/config');

      vi.mocked(validateEnv).mockReturnValue({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        REDIS_URL: '',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
        LOG_LEVEL: 'info',
      } as Env);

      const serviceWithoutRedis = new HealthService();

      expect(() => serviceWithoutRedis.onModuleDestroy()).not.toThrow();

      // Restore default mock
      vi.mocked(validateEnv).mockReturnValue({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        REDIS_URL: 'redis://localhost:6379',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
        LOG_LEVEL: 'info',
      } as Env);
    });
  });
});
