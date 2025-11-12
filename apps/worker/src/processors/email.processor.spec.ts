import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailProcessorService } from './email.processor';

// Type for email job data
interface EmailJob {
  type: 'shift-assigned' | 'shift-reminder' | 'password-reset' | 'welcome';
  to: string;
  subject: string;
  data: Record<string, unknown>;
}

// Type for accessing private methods in tests
// Using a separate interface to avoid TypeScript intersection issues with private methods
interface EmailProcessorServiceTestAccess {
  // eslint-disable-next-line no-unused-vars
  parseRedisUrl: (_url: string) => {
    host: string;
    port: number;
    password?: string;
  };
  // eslint-disable-next-line no-unused-vars
  processEmail: (_jobData: EmailJob) => Promise<void>;
  start: () => Promise<void>;
  onModuleDestroy: () => Promise<void>;
}

// Mock BullMQ Worker
const mockWorkerClose = vi.fn().mockResolvedValue(undefined);
const mockWorkerOn = vi.fn();
// eslint-disable-next-line no-unused-vars
let workerProcessor: ((_job: Job<EmailJob>) => Promise<unknown>) | null = null;

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation((_queueName, processor) => {
    workerProcessor = processor;
    return {
      on: mockWorkerOn,
      close: mockWorkerClose,
    };
  }),
  Job: vi.fn(),
}));

describe('EmailProcessorService', () => {
  let service: EmailProcessorService;
  let serviceTest: EmailProcessorServiceTestAccess;
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    workerProcessor = null;
    process.env = { ...originalEnv };

    // Set required env vars
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.CLERK_SECRET_KEY = 'sk_test_123';
    process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_123';

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailProcessorService],
    }).compile();

    service = module.get<EmailProcessorService>(EmailProcessorService);
    // Type assertion for accessing private methods in tests
    serviceTest = service as unknown as EmailProcessorServiceTestAccess;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('parseRedisUrl', () => {
    it('should parse standard Redis URL', () => {
      const result = serviceTest.parseRedisUrl('redis://localhost:6379');

      expect(result).toEqual({
        host: 'localhost',
        port: 6379,
      });
    });

    it('should parse Redis URL with password', () => {
      const result = serviceTest.parseRedisUrl(
        'redis://:mypassword@localhost:6379',
      );

      expect(result).toEqual({
        host: 'localhost',
        port: 6379,
        password: 'mypassword',
      });
    });

    it('should parse Redis URL with username and password', () => {
      const result = serviceTest.parseRedisUrl(
        'redis://user:pass@localhost:6379',
      );

      expect(result).toEqual({
        host: 'localhost',
        port: 6379,
        password: 'pass',
      });
    });

    it('should parse Redis URL with custom port', () => {
      const result = serviceTest.parseRedisUrl('redis://localhost:6380');

      expect(result).toEqual({
        host: 'localhost',
        port: 6380,
      });
    });

    it('should parse Redis URL with remote host', () => {
      const result = serviceTest.parseRedisUrl(
        'redis://redis.example.com:6379',
      );

      expect(result).toEqual({
        host: 'redis.example.com',
        port: 6379,
      });
    });

    it('should use default port when not specified', () => {
      const result = serviceTest.parseRedisUrl('redis://localhost');

      expect(result).toEqual({
        host: 'localhost',
        port: 6379,
      });
    });

    it('should fallback to localhost on invalid URL', () => {
      const result = serviceTest.parseRedisUrl('invalid-url');

      expect(result).toEqual({
        host: 'localhost',
        port: 6379,
      });
    });

    it('should fallback to localhost on empty URL', () => {
      const result = serviceTest.parseRedisUrl('');

      expect(result).toEqual({
        host: 'localhost',
        port: 6379,
      });
    });
  });

  describe('start', () => {
    it('should initialize worker with correct queue name', async () => {
      const { Worker } = await import('bullmq');

      await service.start();

      expect(Worker).toHaveBeenCalledWith(
        'email-queue',
        expect.any(Function),
        expect.objectContaining({
          connection: expect.any(Object),
          concurrency: 5,
        }),
      );
    });

    it('should parse Redis URL from environment', async () => {
      process.env.REDIS_URL = 'redis://:testpass@redis.example.com:6380';

      const { Worker } = await import('bullmq');

      await service.start();

      expect(Worker).toHaveBeenCalledWith(
        'email-queue',
        expect.any(Function),
        expect.objectContaining({
          connection: {
            host: 'redis.example.com',
            port: 6380,
            password: 'testpass',
          },
        }),
      );
    });

    it('should use default Redis URL when not provided', async () => {
      delete process.env.REDIS_URL;

      const { Worker } = await import('bullmq');

      await service.start();

      expect(Worker).toHaveBeenCalledWith(
        'email-queue',
        expect.any(Function),
        expect.objectContaining({
          connection: {
            host: 'localhost',
            port: 6379,
          },
        }),
      );
    });

    it('should register completed event handler', async () => {
      await service.start();

      expect(mockWorkerOn).toHaveBeenCalledWith(
        'completed',
        expect.any(Function),
      );
    });

    it('should register failed event handler', async () => {
      await service.start();

      expect(mockWorkerOn).toHaveBeenCalledWith('failed', expect.any(Function));
    });

    it('should log startup message', async () => {
      const logSpy = vi.spyOn(Logger.prototype, 'log');

      await service.start();

      expect(logSpy).toHaveBeenCalledWith('✅ Email processor started');
    });
  });

  describe('processEmail', () => {
    it('should process email job successfully', async () => {
      const jobData = {
        type: 'shift-assigned' as const,
        to: 'test@example.com',
        subject: 'Test Subject',
        data: { shiftId: '123' },
      };

      const logSpy = vi.spyOn(Logger.prototype, 'log');

      await serviceTest.processEmail(jobData);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('📧 Email to be sent:'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Type: shift-assigned'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('To: test@example.com'),
      );
    });

    it('should handle all email types', async () => {
      const emailTypes = [
        'shift-assigned',
        'shift-reminder',
        'password-reset',
        'welcome',
      ] as const;

      for (const type of emailTypes) {
        const jobData = {
          type,
          to: 'test@example.com',
          subject: `Test ${type}`,
          data: {},
        };

        await expect(
          serviceTest.processEmail(jobData),
        ).resolves.toBeUndefined();
      }
    });

    it('should simulate delay for email sending', async () => {
      const jobData = {
        type: 'shift-assigned' as const,
        to: 'test@example.com',
        subject: 'Test',
        data: {},
      };

      const start = Date.now();
      await serviceTest.processEmail(jobData);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });

  describe('worker processor function', () => {
    it('should call processEmail with job data', async () => {
      await service.start();

      const mockJob = {
        id: 'job-123',
        data: {
          type: 'shift-assigned' as const,
          to: 'test@example.com',
          subject: 'Test',
          data: {},
        },
      } as Job<EmailJob>;

      expect(workerProcessor).not.toBeNull();
      const result = await workerProcessor!(mockJob);

      expect(result).toEqual({ success: true });
    });

    it('should log job processing start', async () => {
      const logSpy = vi.spyOn(Logger.prototype, 'log');

      await service.start();

      const mockJob = {
        id: 'job-456',
        data: {
          type: 'welcome' as const,
          to: 'new@example.com',
          subject: 'Welcome',
          data: {},
        },
      } as Job<EmailJob>;

      expect(workerProcessor).not.toBeNull();
      await workerProcessor!(mockJob);

      expect(logSpy).toHaveBeenCalledWith(
        'Processing email job: job-456 - Type: welcome',
      );
    });

    it('should log job completion', async () => {
      const logSpy = vi.spyOn(Logger.prototype, 'log');

      await service.start();

      const mockJob = {
        id: 'job-789',
        data: {
          type: 'shift-reminder' as const,
          to: 'test@example.com',
          subject: 'Reminder',
          data: {},
        },
      } as Job<EmailJob>;

      expect(workerProcessor).not.toBeNull();
      await workerProcessor!(mockJob);

      expect(logSpy).toHaveBeenCalledWith(
        'Email job job-789 completed successfully',
      );
    });

    it('should throw and log error on processing failure', async () => {
      const errorSpy = vi.spyOn(Logger.prototype, 'error');

      await service.start();

      // Mock processEmail to throw error
      const error = new Error('Email processing failed');
      vi.spyOn(serviceTest, 'processEmail').mockRejectedValueOnce(error);

      const mockJob = {
        id: 'job-error',
        data: {
          type: 'shift-assigned' as const,
          to: 'test@example.com',
          subject: 'Test',
          data: {},
        },
      } as Job<EmailJob>;

      expect(workerProcessor).not.toBeNull();
      await expect(workerProcessor!(mockJob)).rejects.toThrow(
        'Email processing failed',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Email job job-error failed:',
        error,
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should close worker when initialized', async () => {
      await service.start();
      await service.onModuleDestroy();

      expect(mockWorkerClose).toHaveBeenCalledTimes(1);
    });

    it('should log shutdown message', async () => {
      const logSpy = vi.spyOn(Logger.prototype, 'log');

      await service.start();
      await service.onModuleDestroy();

      expect(logSpy).toHaveBeenCalledWith('Email processor stopped');
    });

    it('should handle destroy without initialized worker', async () => {
      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
      expect(mockWorkerClose).not.toHaveBeenCalled();
    });
  });
});
