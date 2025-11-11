import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { closeDatabase } from './index';

// Mock postgres and drizzle
const mockEnd = vi.fn().mockResolvedValue(undefined);
const mockPostgresClient = {
  end: mockEnd,
};
const mockDrizzleDb = {
  query: {},
  select: vi.fn(),
};

vi.mock('postgres', () => ({
  default: vi.fn().mockReturnValue(mockPostgresClient),
}));

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn().mockReturnValue(mockDrizzleDb),
}));

describe('Database Package', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the singleton state by re-requiring the module
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(async () => {
    process.env = originalEnv;
    // Clean up any open connections
    await closeDatabase();
  });

  describe('getDatabase', () => {
    it('should create and return database instance', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      const postgres = require('postgres').default;
      const { drizzle } = require('drizzle-orm/postgres-js');
      const { getDatabase } = require('./index');

      const db = getDatabase();

      expect(postgres).toHaveBeenCalledWith(
        'postgresql://test:test@localhost:5432/test',
      );
      expect(drizzle).toHaveBeenCalledWith(
        mockPostgresClient,
        expect.objectContaining({ schema: expect.any(Object) }),
      );
      expect(db).toBe(mockDrizzleDb);
    });

    it('should return the same instance on multiple calls (singleton)', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      const { getDatabase } = require('./index');
      const postgres = require('postgres').default;
      const { drizzle } = require('drizzle-orm/postgres-js');

      const db1 = getDatabase();
      const db2 = getDatabase();

      // Should only create connection once
      expect(postgres).toHaveBeenCalledTimes(1);
      expect(drizzle).toHaveBeenCalledTimes(1);

      // Should return same instance
      expect(db1).toBe(db2);
    });

    it('should throw error when DATABASE_URL is not defined', () => {
      delete process.env.DATABASE_URL;

      const { getDatabase } = require('./index');

      expect(() => getDatabase()).toThrow('DATABASE_URL is not defined');
    });

    it('should throw error when DATABASE_URL is empty string', () => {
      process.env.DATABASE_URL = '';

      const { getDatabase } = require('./index');

      expect(() => getDatabase()).toThrow('DATABASE_URL is not defined');
    });

    it('should handle different connection strings', () => {
      const connectionStrings = [
        'postgresql://user:pass@localhost:5432/db',
        'postgresql://user:pass@prod.example.com:5432/prod_db',
        'postgresql://user:pass@localhost:5433/custom_port',
      ];

      connectionStrings.forEach((connStr) => {
        vi.resetModules();
        process.env.DATABASE_URL = connStr;

        const postgres = require('postgres').default;
        const { getDatabase } = require('./index');

        getDatabase();

        expect(postgres).toHaveBeenCalledWith(connStr);
      });
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      const { getDatabase, closeDatabase } = require('./index');

      // Create connection
      getDatabase();

      // Close connection
      await closeDatabase();

      expect(mockEnd).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple close calls gracefully', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      const { getDatabase, closeDatabase } = require('./index');

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
      const { closeDatabase } = require('./index');

      // Should not throw
      await expect(closeDatabase()).resolves.toBeUndefined();
      expect(mockEnd).not.toHaveBeenCalled();
    });

    it('should reset singleton state after close', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      const postgres = require('postgres').default;
      const { drizzle } = require('drizzle-orm/postgres-js');
      const { getDatabase, closeDatabase } = require('./index');

      // Create connection
      const db1 = getDatabase();

      // Close connection
      await closeDatabase();

      // Create new connection
      const db2 = getDatabase();

      // Should create new instances
      expect(postgres).toHaveBeenCalledTimes(2);
      expect(drizzle).toHaveBeenCalledTimes(2);

      // Instances should be different
      expect(db1).toBe(mockDrizzleDb);
      expect(db2).toBe(mockDrizzleDb);
    });

    it('should handle connection close errors', async () => {
      const closeError = new Error('Connection close failed');
      mockEnd.mockRejectedValueOnce(closeError);

      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      const { getDatabase, closeDatabase } = require('./index');

      // Create connection
      getDatabase();

      // Close connection should propagate error
      await expect(closeDatabase()).rejects.toThrow('Connection close failed');
    });
  });

  describe('schema export', () => {
    it('should export schema object', () => {
      const { schema } = require('./index');

      expect(schema).toBeDefined();
      expect(typeof schema).toBe('object');
    });

    it('should export individual schema tables', () => {
      const { users, organizations, employees, shifts } = require('./index');

      expect(users).toBeDefined();
      expect(organizations).toBeDefined();
      expect(employees).toBeDefined();
      expect(shifts).toBeDefined();
    });
  });
});
