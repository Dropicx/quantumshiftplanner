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

// Type for response with NestJS compatibility methods
// Note: FastifyReply may already have a status() method, so we use intersection
// with a type that allows optional override via index signature
type ResponseWithStatus = FastifyReply & {
  // NestJS compatibility wrapper - check existence before use
  // eslint-disable-next-line no-unused-vars
  status?: (_statusCode: number) => FastifyReply;
  // Direct statusCode property for fallback
  statusCode?: number;
};

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

    // Log the actual exception for debugging (especially for non-HTTP exceptions)
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Non-HTTP exception caught: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
        'ExceptionFilter',
        correlationId,
      );
    }

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

    // Send response - Fastify reply object
    const responsePayload = {
      ...errorResponse,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    // For Fastify, we need to use the reply object's methods
    // NestJS wraps FastifyReply, but the methods should still be accessible
    // Access response object without type casting first to check actual structure
    const reply = response as unknown as ResponseWithStatus;

    // Use Fastify's reply methods: code() sets status, send() sends response
    // NestJS Fastify adapter also provides status() for compatibility
    // Check for method existence before calling
    try {
      // Try Fastify's code().send() chain first
      if (
        typeof reply.code === 'function' &&
        typeof reply.send === 'function'
      ) {
        reply.code(status).send(responsePayload);
        return;
      }

      // Try NestJS compatibility wrapper status().send() chain
      if (
        typeof reply.status === 'function' &&
        typeof reply.send === 'function'
      ) {
        reply.status(status).send(responsePayload);
        return;
      }

      // Try setting statusCode and using send()
      if (typeof reply.send === 'function') {
        (reply as { statusCode?: number }).statusCode = status;
        reply.send(responsePayload);
        return;
      }

      // Try accessing raw response through different paths
      // NestJS might wrap the response differently
      // Also check if response itself is the raw Node.js response
      const responseAsAny = response as unknown as Record<string, unknown>;
      const rawResponse =
        (reply as { raw?: unknown }).raw ||
        (response as { raw?: unknown }).raw ||
        (response as unknown as { res?: { raw?: unknown } }).res?.raw ||
        // Check if response itself has end method (might be raw Node.js response)
        (typeof responseAsAny.end === 'function' ? responseAsAny : null);

      if (
        rawResponse &&
        typeof rawResponse === 'object' &&
        'end' in rawResponse &&
        typeof (rawResponse as { end: unknown }).end === 'function' &&
        !(rawResponse as { headersSent?: boolean }).headersSent
      ) {
        const nodeResponse = rawResponse as {
          statusCode?: number;
          // eslint-disable-next-line no-unused-vars
          setHeader: (_name: string, _value: string) => void;
          // eslint-disable-next-line no-unused-vars
          end: (_chunk: string) => void;
          headersSent?: boolean;
        };
        nodeResponse.statusCode = status;
        nodeResponse.setHeader('Content-Type', 'application/json');
        nodeResponse.end(JSON.stringify(responsePayload));
        return;
      }

      // Last resort: try to access response through request
      const requestRaw = request.raw as unknown as {
        res?: {
          statusCode?: number;
          // eslint-disable-next-line no-unused-vars
          setHeader?: (_name: string, _value: string) => void;
          // eslint-disable-next-line no-unused-vars
          end?: (_chunk: string) => void;
          headersSent?: boolean;
        };
      };

      if (
        requestRaw?.res &&
        typeof requestRaw.res.end === 'function' &&
        !requestRaw.res.headersSent
      ) {
        requestRaw.res.statusCode = status;
        if (requestRaw.res.setHeader) {
          requestRaw.res.setHeader('Content-Type', 'application/json');
        }
        requestRaw.res.end(JSON.stringify(responsePayload));
        return;
      }

      // If all methods fail, log error with more details
      const replyAsRecord = reply as unknown as Record<string, unknown>;
      const responseKeys = Object.keys(replyAsRecord).slice(0, 10).join(', ');
      this.logger.error(
        `Failed to send error response - no valid response method found. Response type: ${typeof reply}, has code: ${typeof reply.code}, has status: ${typeof reply.status}, has send: ${typeof reply.send}, has raw: ${!!(reply as { raw?: unknown }).raw}, response keys: ${responseKeys}`,
        undefined,
        'ExceptionFilter',
        correlationId,
      );
    } catch (sendError) {
      // If sending fails, try raw response as last resort
      try {
        const rawResponse =
          (reply as { raw?: unknown }).raw ||
          (response as { raw?: unknown }).raw;

        if (
          rawResponse &&
          typeof rawResponse === 'object' &&
          'end' in rawResponse &&
          typeof (rawResponse as { end: unknown }).end === 'function' &&
          !(rawResponse as { headersSent?: boolean }).headersSent
        ) {
          const nodeResponse = rawResponse as {
            statusCode?: number;
            // eslint-disable-next-line no-unused-vars
            setHeader: (_name: string, _value: string) => void;
            // eslint-disable-next-line no-unused-vars
            end: (_chunk: string) => void;
          };
          nodeResponse.statusCode = status;
          nodeResponse.setHeader('Content-Type', 'application/json');
          nodeResponse.end(JSON.stringify(responsePayload));
        } else {
          this.logger.error(
            `Failed to send error response: ${sendError instanceof Error ? sendError.message : String(sendError)}`,
            sendError instanceof Error ? sendError.stack : undefined,
            'ExceptionFilter',
            correlationId,
          );
        }
      } catch (finalError) {
        this.logger.error(
          `Complete failure to send error response: ${finalError instanceof Error ? finalError.message : String(finalError)}`,
          finalError instanceof Error ? finalError.stack : undefined,
          'ExceptionFilter',
          correlationId,
        );
      }
    }
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
