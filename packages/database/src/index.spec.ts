import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  closeDatabase,
  employees,
  getDatabase,
  organizations,
  schema,
  shifts,
  users,
} from './index';

// Mock postgres and drizzle - using vi.hoisted() to avoid hoisting issues
const { mockEnd, mockPostgresClient, mockDrizzleDb } = vi.hoisted(() => {
  const mockEnd = vi.fn().mockResolvedValue(undefined);
  const mockPostgresClient = {
    end: mockEnd,
  };
  const mockDrizzleDb = {
    query: {},
    select: vi.fn(),
  };

  return { mockEnd, mockPostgresClient, mockDrizzleDb };
});

vi.mock('postgres', () => ({
  default: vi.fn().mockReturnValue(mockPostgresClient),
}));

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn().mockReturnValue(mockDrizzleDb),
}));

describe('Database Package', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the singleton state by closing database
    await closeDatabase();
    process.env = { ...originalEnv };
  });

  afterEach(async () => {
    process.env = originalEnv;
    // Clean up any open connections
    await closeDatabase();
  });

  describe('getDatabase', () => {
    it('should create and return database instance', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      const postgres = await import('postgres');
      const drizzleModule = await import('drizzle-orm/postgres-js');

      const db = getDatabase();

      expect(postgres.default).toHaveBeenCalledWith(
        'postgresql://test:test@localhost:5432/test',
      );
      expect(drizzleModule.drizzle).toHaveBeenCalledWith(
        mockPostgresClient,
        expect.objectContaining({ schema: expect.any(Object) }),
      );
      expect(db).toBe(mockDrizzleDb);
    });

    it('should return the same instance on multiple calls (singleton)', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      const postgres = await import('postgres');
      const drizzleModule = await import('drizzle-orm/postgres-js');

      const db1 = getDatabase();
      const db2 = getDatabase();

      // Should only create connection once
      expect(postgres.default).toHaveBeenCalledTimes(1);
      expect(drizzleModule.drizzle).toHaveBeenCalledTimes(1);

      // Should return same instance
      expect(db1).toBe(db2);
    });

    it('should throw error when DATABASE_URL is not defined', () => {
      delete process.env.DATABASE_URL;

      expect(() => getDatabase()).toThrow('DATABASE_URL is not defined');
    });

    it('should throw error when DATABASE_URL is empty string', () => {
      process.env.DATABASE_URL = '';

      expect(() => getDatabase()).toThrow('DATABASE_URL is not defined');
    });

    it('should handle different connection strings', async () => {
      const connectionStrings = [
        'postgresql://user:pass@localhost:5432/db',
        'postgresql://user:pass@prod.example.com:5432/prod_db',
        'postgresql://user:pass@localhost:5433/custom_port',
      ];

      const postgres = await import('postgres');

      for (const connStr of connectionStrings) {
        await closeDatabase(); // Reset singleton
        vi.clearAllMocks();
        process.env.DATABASE_URL = connStr;

        getDatabase();

        expect(postgres.default).toHaveBeenCalledWith(connStr);
      }
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      // Create connection
      getDatabase();

      // Close connection
      await closeDatabase();

      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple close calls gracefully', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      // Create connection
      getDatabase();

      // Close multiple times
      await closeDatabase();
      await closeDatabase();
      await closeDatabase();

      // Should only call end once
      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it('should handle close without open connection', async () => {
      // Should not throw
      await expect(closeDatabase()).resolves.toBeUndefined();
      expect(mockEnd).not.toHaveBeenCalled();
    });

    it('should reset singleton state after close', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      const postgres = await import('postgres');
      const drizzleModule = await import('drizzle-orm/postgres-js');

      // Create connection
      const db1 = getDatabase();

      // Close connection
      await closeDatabase();

      // Create new connection
      const db2 = getDatabase();

      // Should create new instances
      expect(postgres.default).toHaveBeenCalledTimes(2);
      expect(drizzleModule.drizzle).toHaveBeenCalledTimes(2);

      // Instances should be different
      expect(db1).toBe(mockDrizzleDb);
      expect(db2).toBe(mockDrizzleDb);
    });

    it('should handle connection close errors', async () => {
      const closeError = new Error('Connection close failed');
      mockEnd.mockRejectedValueOnce(closeError);

      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      // Create connection
      getDatabase();

      // Close connection should propagate error
      await expect(closeDatabase()).rejects.toThrow('Connection close failed');
    });
  });

  describe('schema export', () => {
    it('should export schema object', () => {
      expect(schema).toBeDefined();
      expect(typeof schema).toBe('object');
    });

    it('should export individual schema tables', () => {
      expect(users).toBeDefined();
      expect(organizations).toBeDefined();
      expect(employees).toBeDefined();
      expect(shifts).toBeDefined();
    });
  });
});
