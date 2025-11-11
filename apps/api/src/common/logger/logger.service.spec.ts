import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import * as winston from 'winston';

import { AppLoggerService, LoggerConfigService } from './logger.service';

// Mock validateEnv
vi.mock('@planday/config', () => ({
  validateEnv: vi.fn().mockReturnValue({
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    CLERK_SECRET_KEY: 'sk_test_123',
    CLERK_PUBLISHABLE_KEY: 'pk_test_123',
    LOG_LEVEL: 'info',
  }),
}));

describe('LoggerConfigService', () => {
  let service: LoggerConfigService;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LoggerConfigService();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create winston module options', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.CLERK_SECRET_KEY = 'sk_test_123';
    process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_123';

    const options = service.createWinstonModuleOptions();

    expect(options).toBeDefined();
    expect(options.transports).toBeDefined();
    expect(Array.isArray(options.transports)).toBe(true);
    expect(options.exitOnError).toBe(false);
  });

  it('should use info log level by default', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.CLERK_SECRET_KEY = 'sk_test_123';
    process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_123';

    const options = service.createWinstonModuleOptions();

    expect(options.level).toBe('info');
  });

  it('should respect LOG_LEVEL env var', async () => {
    const { validateEnv } = await import('@planday/config');

    vi.mocked(validateEnv).mockReturnValueOnce({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      CLERK_SECRET_KEY: 'sk_test_123',
      CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      LOG_LEVEL: 'debug',
    } as any);

    // Create new service instance to pick up new env vars
    const newService = new LoggerConfigService();
    const options = newService.createWinstonModuleOptions();

    expect(options.level).toBe('debug');
  });

  it('should include console transport', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.CLERK_SECRET_KEY = 'sk_test_123';
    process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_123';

    const options = service.createWinstonModuleOptions();

    expect(Array.isArray(options.transports)).toBe(true);
    expect((options.transports as any[]).length).toBeGreaterThan(0);
  });

  it('should add file transports in production', async () => {
    const { validateEnv } = await import('@planday/config');

    vi.mocked(validateEnv).mockReturnValueOnce({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      CLERK_SECRET_KEY: 'sk_test_123',
      CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      LOG_LEVEL: 'info',
    } as any);

    const prodService = new LoggerConfigService();
    const options = prodService.createWinstonModuleOptions();

    // Should have console + 2 file transports (error + combined)
    expect((options.transports as any[]).length).toBe(3);
  });

  it('should not add file transports in development', async () => {
    const { validateEnv } = await import('@planday/config');

    vi.mocked(validateEnv).mockReturnValueOnce({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      CLERK_SECRET_KEY: 'sk_test_123',
      CLERK_PUBLISHABLE_KEY: 'pk_test_123',
      LOG_LEVEL: 'info',
    } as any);

    const devService = new LoggerConfigService();
    const options = devService.createWinstonModuleOptions();

    // Should only have console transport
    expect((options.transports as any[]).length).toBe(1);
  });
});

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let mockLogger: winston.Logger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn(),
    } as any;

    service = new AppLoggerService(mockLogger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should call winston logger info method', () => {
      service.log('test message', 'TestContext', 'correlation-id');

      expect(mockLogger.info).toHaveBeenCalledWith('test message', {
        context: 'TestContext',
        correlationId: 'correlation-id',
      });
    });

    it('should work without context and correlationId', () => {
      service.log('test message');

      expect(mockLogger.info).toHaveBeenCalledWith('test message', {
        context: undefined,
        correlationId: undefined,
      });
    });
  });

  describe('error', () => {
    it('should call winston logger error method with trace', () => {
      const trace = 'Error: Test error\n  at Object.<anonymous>';

      service.error('error message', trace, 'ErrorContext', 'correlation-id');

      expect(mockLogger.error).toHaveBeenCalledWith('error message', {
        context: 'ErrorContext',
        correlationId: 'correlation-id',
        trace,
        stack: trace,
      });
    });

    it('should work without trace', () => {
      service.error('error message', undefined, 'ErrorContext');

      expect(mockLogger.error).toHaveBeenCalledWith('error message', {
        context: 'ErrorContext',
        correlationId: undefined,
        trace: undefined,
        stack: undefined,
      });
    });
  });

  describe('warn', () => {
    it('should call winston logger warn method', () => {
      service.warn('warning message', 'WarnContext', 'correlation-id');

      expect(mockLogger.warn).toHaveBeenCalledWith('warning message', {
        context: 'WarnContext',
        correlationId: 'correlation-id',
      });
    });
  });

  describe('debug', () => {
    it('should call winston logger debug method', () => {
      service.debug('debug message', 'DebugContext', 'correlation-id');

      expect(mockLogger.debug).toHaveBeenCalledWith('debug message', {
        context: 'DebugContext',
        correlationId: 'correlation-id',
      });
    });
  });

  describe('verbose', () => {
    it('should call winston logger verbose method', () => {
      service.verbose('verbose message', 'VerboseContext', 'correlation-id');

      expect(mockLogger.verbose).toHaveBeenCalledWith('verbose message', {
        context: 'VerboseContext',
        correlationId: 'correlation-id',
      });
    });
  });

  describe('logWithMeta', () => {
    it('should log with additional metadata', () => {
      const meta = { userId: '123', action: 'login' };

      service.logWithMeta(
        'info',
        'User action',
        meta,
        'MetaContext',
        'correlation-id',
      );

      expect(mockLogger.info).toHaveBeenCalledWith('User action', {
        userId: '123',
        action: 'login',
        context: 'MetaContext',
        correlationId: 'correlation-id',
      });
    });

    it('should support different log levels', () => {
      const meta = { data: 'test' };

      service.logWithMeta('error', 'Error message', meta, 'Context', 'id');
      expect(mockLogger.error).toHaveBeenCalledWith('Error message', {
        data: 'test',
        context: 'Context',
        correlationId: 'id',
      });

      service.logWithMeta('warn', 'Warn message', meta, 'Context', 'id');
      expect(mockLogger.warn).toHaveBeenCalled();

      service.logWithMeta('debug', 'Debug message', meta, 'Context', 'id');
      expect(mockLogger.debug).toHaveBeenCalled();

      service.logWithMeta('verbose', 'Verbose message', meta, 'Context', 'id');
      expect(mockLogger.verbose).toHaveBeenCalled();
    });
  });
});
