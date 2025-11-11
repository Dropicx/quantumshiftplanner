import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RequestLoggerMiddleware } from './request-logger.middleware';

// Mock types
type MockRequest = {
  headers: Record<string, string | string[] | undefined>;
  correlationId?: string;
};

type MockResponse = {
  header: ReturnType<typeof vi.fn>;
};

type MockNext = ReturnType<typeof vi.fn>;

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'generated-uuid-1234'),
}));

describe('RequestLoggerMiddleware', () => {
  let middleware: RequestLoggerMiddleware;
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;
  let mockNext: MockNext;

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

  // Helper to call middleware with proper typing
  const callMiddleware = (
    req: MockRequest,
    res: MockResponse,
    next: MockNext,
  ) => {
    middleware.use(
      req as unknown as never,
      res as unknown as never,
      next as never,
    );
  };

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    it('should generate correlation ID if not present', () => {
      callMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockRequest.correlationId).toBe('generated-uuid-1234');
      expect(mockResponse.header).toHaveBeenCalledWith(
        'X-Correlation-ID',
        'generated-uuid-1234',
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing correlation ID from headers', () => {
      mockRequest.headers['x-correlation-id'] = 'existing-correlation-id';

      callMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockRequest.correlationId).toBe('existing-correlation-id');
      expect(mockResponse.header).toHaveBeenCalledWith(
        'X-Correlation-ID',
        'existing-correlation-id',
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should attach correlation ID to request object', () => {
      callMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockRequest).toHaveProperty('correlationId');
      expect(typeof mockRequest.correlationId).toBe('string');
      expect(mockRequest.correlationId!.length).toBeGreaterThan(0);
    });

    it('should set correlation ID in response headers', () => {
      callMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.header).toHaveBeenCalledWith(
        'X-Correlation-ID',
        expect.any(String),
      );
    });

    it('should call next middleware', () => {
      callMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle uppercase header name', () => {
      mockRequest.headers['X-Correlation-ID'] = 'uppercase-correlation-id';

      callMiddleware(mockRequest, mockResponse, mockNext);

      // Headers are typically lowercase in Node.js/Express
      expect(mockRequest.correlationId!).toBe('generated-uuid-1234');
    });

    it('should handle empty correlation ID from headers', () => {
      mockRequest.headers['x-correlation-id'] = '';

      callMiddleware(mockRequest, mockResponse, mockNext);

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

      const req1: MockRequest = { headers: {} };
      const res1: MockResponse = { header: vi.fn() };
      const next1: MockNext = vi.fn();

      const req2: MockRequest = { headers: {} };
      const res2: MockResponse = { header: vi.fn() };
      const next2: MockNext = vi.fn();

      callMiddleware(req1, res1, next1);
      callMiddleware(req2, res2, next2);

      expect(req1.correlationId).toBe('generated-uuid-1');
      expect(req2.correlationId).toBe('generated-uuid-2');
      expect(req1.correlationId).not.toBe(req2.correlationId);
    });
  });
});
