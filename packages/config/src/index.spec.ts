import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { config, envSchema, validateEnv } from './index';

describe('Config Package', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and env before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('config object', () => {
    it('should export correct app configuration', () => {
      expect(config.app.name).toBe('Planday Clone');
      expect(config.app.version).toBe('1.0.0');
    });

    it('should export correct pagination defaults', () => {
      expect(config.pagination.defaultLimit).toBe(20);
      expect(config.pagination.maxLimit).toBe(100);
    });

    it('should export correct rate limit configuration', () => {
      expect(config.rateLimit.windowMs).toBe(15 * 60 * 1000);
      expect(config.rateLimit.maxRequests).toBe(100);
    });

    it('should export correct JWT configuration', () => {
      expect(config.jwt.expiresIn).toBe('7d');
    });
  });

  describe('envSchema', () => {
    it('should validate correct environment variables', () => {
      const validEnv = {
        NODE_ENV: 'development',
        PORT: '4000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        REDIS_URL: 'redis://localhost:6379',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      };

      const result = envSchema.parse(validEnv);
      expect(result).toEqual({
        ...validEnv,
        LOG_LEVEL: 'info', // Default value added by schema
      });
    });

    it('should apply default NODE_ENV value', () => {
      const envWithoutNodeEnv = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      };

      const result = envSchema.parse(envWithoutNodeEnv);
      expect(result.NODE_ENV).toBe('development');
    });

    it('should apply default PORT value', () => {
      const envWithoutPort = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      };

      const result = envSchema.parse(envWithoutPort);
      expect(result.PORT).toBe('4000');
    });

    it('should allow optional REDIS_URL', () => {
      const envWithoutRedis = {
        NODE_ENV: 'test',
        PORT: '4000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      };

      const result = envSchema.parse(envWithoutRedis);
      expect(result.REDIS_URL).toBeUndefined();
    });

    it('should reject invalid NODE_ENV value', () => {
      const invalidEnv = {
        NODE_ENV: 'invalid',
        PORT: '4000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      };

      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });

    it('should reject missing DATABASE_URL', () => {
      const invalidEnv = {
        NODE_ENV: 'test',
        PORT: '4000',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      };

      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });

    it('should reject missing CLERK_SECRET_KEY', () => {
      const invalidEnv = {
        NODE_ENV: 'test',
        PORT: '4000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      };

      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });

    it('should reject missing CLERK_PUBLISHABLE_KEY', () => {
      const invalidEnv = {
        NODE_ENV: 'test',
        PORT: '4000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        CLERK_SECRET_KEY: 'sk_test_123',
      };

      expect(() => envSchema.parse(invalidEnv)).toThrow();
    });

    it('should accept all valid NODE_ENV values', () => {
      const envValues = ['development', 'test', 'production'];

      envValues.forEach((nodeEnv) => {
        const env = {
          NODE_ENV: nodeEnv,
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          CLERK_SECRET_KEY: 'sk_test_123',
          CLERK_PUBLISHABLE_KEY: 'pk_test_123',
        };

        const result = envSchema.parse(env);
        expect(result.NODE_ENV).toBe(nodeEnv);
      });
    });
  });

  describe('validateEnv', () => {
    it('should return valid environment variables', () => {
      process.env = {
        NODE_ENV: 'test',
        PORT: '4000',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
        REDIS_URL: 'redis://localhost:6379',
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      };

      const result = validateEnv();

      expect(result.NODE_ENV).toBe('test');
      expect(result.PORT).toBe('4000');
      expect(result.DATABASE_URL).toBe(
        'postgresql://test:test@localhost:5432/test',
      );
      expect(result.REDIS_URL).toBe('redis://localhost:6379');
      expect(result.CLERK_SECRET_KEY).toBe('sk_test_123');
      expect(result.CLERK_PUBLISHABLE_KEY).toBe('pk_test_123');
    });

    it('should throw error for invalid environment variables', () => {
      process.env = {
        NODE_ENV: 'test',
        PORT: '4000',
        // Missing DATABASE_URL
        CLERK_SECRET_KEY: 'sk_test_123',
        CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      };

      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('should log error message when validation fails', () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      process.env = {
        NODE_ENV: 'test',
        // Missing required variables
      };

      expect(() => validateEnv()).toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Invalid environment variables:',
        expect.anything(),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle completely empty process.env', () => {
      process.env = {};

      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });
  });
});
