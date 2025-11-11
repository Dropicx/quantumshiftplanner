import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLoggerService } from '../logger/logger.service';

import { HttpExceptionFilter } from './http-exception.filter';

// Mock types
type MockLogger = Pick<
  AppLoggerService,
  'error' | 'warn' | 'log' | 'logWithMeta'
>;

type MockResponse = Pick<FastifyReply, 'status' | 'send'>;

type MockRequest = {
  method: string;
  url: string;
  query: Record<string, unknown>;
  params: Record<string, unknown>;
  body: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  ip: string;
  correlationId?: string;
};

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockLogger: MockLogger;
  let mockResponse: MockResponse;
  let mockRequest: MockRequest;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      log: vi.fn(),
      logWithMeta: vi.fn(),
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    mockRequest = {
      correlationId: 'test-correlation-id',
      method: 'GET',
      url: '/test',
      query: { param: 'value' },
      params: { id: '123' },
      body: { data: 'test' },
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
    };

    mockHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    filter = new HttpExceptionFilter(mockLogger as AppLoggerService);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle HTTP exceptions', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Test error',
          correlationId: 'test-correlation-id',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle non-HTTP exceptions as 500', () => {
      const exception = new Error('Unknown error');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        }),
      );
    });

    it('should log errors (>=500) with error level', () => {
      const exception = new HttpException(
        'Server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.logWithMeta).toHaveBeenCalled();
    });

    it('should log client errors (4xx) with warn level', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.logWithMeta).toHaveBeenCalledWith(
        'warn',
        expect.any(String),
        expect.any(Object),
        'ExceptionFilter',
        'test-correlation-id',
      );
    });

    it('should include stack trace for Error instances', () => {
      const error = new Error('Test error with stack');
      const exception = new HttpException(
        error,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost);

      expect(mockLogger.logWithMeta).toHaveBeenCalledWith(
        'error',
        expect.any(String),
        expect.objectContaining({
          stack: expect.any(String),
        }),
        'ExceptionFilter',
        'test-correlation-id',
      );
    });

    it('should sanitize sensitive fields in request body', () => {
      mockRequest.body = {
        username: 'test',
        password: 'secret123',
        token: 'abc123',
      };

      const exception = new HttpException(
        'Test error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost);

      expect(mockLogger.logWithMeta).toHaveBeenCalledWith(
        'error',
        expect.any(String),
        expect.objectContaining({
          body: {
            username: 'test',
            password: '[REDACTED]',
            token: '[REDACTED]',
          },
        }),
        expect.any(String),
        expect.any(String),
      );
    });

    it('should sanitize sensitive headers', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        authorization: 'Bearer token123',
        cookie: 'session=abc',
        'x-api-key': 'key123',
      };

      const exception = new HttpException(
        'Test error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost);

      expect(mockLogger.logWithMeta).toHaveBeenCalledWith(
        'error',
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'user-agent': 'test-agent',
            authorization: '[REDACTED]',
            cookie: '[REDACTED]',
            'x-api-key': '[REDACTED]',
          }),
        }),
        expect.any(String),
        expect.any(String),
      );
    });

    it('should handle missing correlation ID', () => {
      mockRequest.correlationId = undefined;

      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: 'unknown',
        }),
      );
    });

    it('should handle complex error responses from HttpException', () => {
      const errorResponse = {
        statusCode: 400,
        message: ['field1 must be a string', 'field2 is required'],
        error: 'Bad Request',
      };

      const exception = new HttpException(
        errorResponse,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: expect.any(Array),
          error: 'Bad Request',
        }),
      );
    });

    it('should log request method and URL', () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';

      const exception = new HttpException(
        'Validation error',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('POST'),
        expect.any(String),
        expect.any(String),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.any(String),
        expect.any(String),
      );
    });
  });
});
