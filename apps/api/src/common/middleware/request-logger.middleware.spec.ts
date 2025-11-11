import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RequestLoggerMiddleware } from './request-logger.middleware';

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'generated-uuid-1234'),
}));

describe('RequestLoggerMiddleware', () => {
  let middleware: RequestLoggerMiddleware;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: any;

  beforeEach(() => {
    middleware = new RequestLoggerMiddleware();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      header: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should generate correlation ID if not present', () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockRequest.correlationId).toBe('generated-uuid-1234');
      expect(mockResponse.header).toHaveBeenCalledWith(
        'X-Correlation-ID',
        'generated-uuid-1234',
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing correlation ID from headers', () => {
      mockRequest.headers['x-correlation-id'] = 'existing-correlation-id';

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockRequest.correlationId).toBe('existing-correlation-id');
      expect(mockResponse.header).toHaveBeenCalledWith(
        'X-Correlation-ID',
        'existing-correlation-id',
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should attach correlation ID to request object', () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockRequest).toHaveProperty('correlationId');
      expect(typeof mockRequest.correlationId).toBe('string');
      expect(mockRequest.correlationId.length).toBeGreaterThan(0);
    });

    it('should set correlation ID in response headers', () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockResponse.header).toHaveBeenCalledWith(
        'X-Correlation-ID',
        expect.any(String),
      );
    });

    it('should call next middleware', () => {
      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle uppercase header name', () => {
      mockRequest.headers['X-Correlation-ID'] = 'uppercase-correlation-id';

      middleware.use(mockRequest, mockResponse, mockNext);

      // Headers are typically lowercase in Node.js/Express
      expect(mockRequest.correlationId).toBe('generated-uuid-1234');
    });

    it('should handle empty correlation ID from headers', () => {
      mockRequest.headers['x-correlation-id'] = '';

      middleware.use(mockRequest, mockResponse, mockNext);

      // Empty string is falsy, so should generate new UUID
      expect(mockRequest.correlationId).toBe('generated-uuid-1234');
    });

    it('should generate unique IDs for multiple requests', async () => {
      const { v4 } = await import('uuid');
      let callCount = 0;

      vi.mocked(v4).mockImplementation(() => {
        callCount++;
        return `generated-uuid-${callCount}`;
      });

      const req1 = { headers: {} };
      const res1 = { header: vi.fn() };
      const next1 = vi.fn();

      const req2 = { headers: {} };
      const res2 = { header: vi.fn() };
      const next2 = vi.fn();

      middleware.use(req1 as any, res1 as any, next1);
      middleware.use(req2 as any, res2 as any, next2);

      expect((req1 as any).correlationId).toBe('generated-uuid-1');
      expect((req2 as any).correlationId).toBe('generated-uuid-2');
      expect((req1 as any).correlationId).not.toBe((req2 as any).correlationId);
    });
  });
});
