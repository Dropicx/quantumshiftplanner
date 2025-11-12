import { IncomingHttpHeaders } from 'node:http';

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

import { AppLoggerService } from '../logger/logger.service';

// Interface for request with correlation ID
interface RequestWithCorrelation extends FastifyRequest {
  correlationId?: string;
}

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<RequestWithCorrelation>();

    // Get correlation ID from request (works with both Express and Fastify)
    const correlationId =
      request.correlationId ||
      (
        request.raw as unknown as
          | (Record<string, unknown> & { correlationId?: string })
          | undefined
      )?.correlationId ||
      'unknown';

    // Determine status code and message
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Extract error details
    const errorResponse =
      typeof message === 'string'
        ? { statusCode: status, message }
        : { statusCode: status, ...message };

    // Determine log level based on status code
    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    // Prepare log metadata
    const logMeta = {
      statusCode: status,
      method: request.method,
      url: request.url,
      query: request.query,
      params: request.params,
      body: this.sanitizeBody(request.body),
      headers: this.sanitizeHeaders(request.headers),
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    // Log the error
    if (logLevel === 'error') {
      this.logger.error(
        `HTTP ${status} ${request.method} ${request.url} - ${JSON.stringify(errorResponse)}`,
        exception instanceof Error ? exception.stack : undefined,
        'ExceptionFilter',
        correlationId,
      );
      this.logger.logWithMeta(
        'error',
        'Request details',
        logMeta,
        'ExceptionFilter',
        correlationId,
      );
    } else {
      this.logger.warn(
        `HTTP ${status} ${request.method} ${request.url} - ${JSON.stringify(errorResponse)}`,
        'ExceptionFilter',
        correlationId,
      );
      this.logger.logWithMeta(
        'warn',
        'Request details',
        logMeta,
        'ExceptionFilter',
        correlationId,
      );
    }

    // Send response (Fastify uses .code() to set HTTP status code)
    response.code(status).send({
      ...errorResponse,
      correlationId,
      timestamp: new Date().toISOString(),
    });
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...(body as Record<string, unknown>) };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authorization',
      'refreshToken',
      'accessToken',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sanitizeHeaders(headers: IncomingHttpHeaders): IncomingHttpHeaders {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];

    for (const header of sensitiveHeaders) {
      const lowerHeader = header.toLowerCase();
      if (sanitized[lowerHeader]) {
        sanitized[lowerHeader] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
