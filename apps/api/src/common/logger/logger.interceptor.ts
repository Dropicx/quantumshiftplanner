import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AppLoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const correlationId = request.correlationId || 'unknown';
    const startTime = Date.now();

    // Log incoming request
    this.logger.logWithMeta(
      'info',
      `Incoming request: ${method} ${url}`,
      {
        method,
        url,
        query,
        params,
        body: this.sanitizeBody(body),
      },
      'HTTP',
      correlationId,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;

          // Log outgoing response
          this.logger.logWithMeta(
            'info',
            `Outgoing response: ${method} ${url} ${statusCode}`,
            {
              method,
              url,
              statusCode,
              responseTime: `${responseTime}ms`,
            },
            'HTTP',
            correlationId,
          );
        },
        error: (error) => {
          this.logger.error(
            `Request failed: ${method} ${url} - ${error.message}`,
            error.stack,
            'HTTP',
            correlationId,
          );
        },
      }),
    );
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
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
