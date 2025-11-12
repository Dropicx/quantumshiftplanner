import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

// Extend FastifyRequest with correlation ID
interface RequestWithCorrelation extends FastifyRequest {
  correlationId?: string;
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    try {
      // Generate correlation ID or use existing one from headers
      const correlationId =
        (req.headers['x-correlation-id'] as string) || uuidv4();

      // Attach correlation ID to request object
      (req as RequestWithCorrelation).correlationId = correlationId;

      // Set correlation ID in response headers
      // Use try-catch in case response object structure differs
      try {
        if (typeof res.header === 'function') {
          res.header('X-Correlation-ID', correlationId);
        } else if (
          typeof (
            res as {
              // eslint-disable-next-line no-unused-vars
              headers?: (_headers: Record<string, string>) => void;
            }
          ).headers === 'function'
        ) {
          (
            res as {
              // eslint-disable-next-line no-unused-vars
              headers: (_headers: Record<string, string>) => void;
            }
          ).headers({
            'X-Correlation-ID': correlationId,
          });
        } else if (
          (
            res as {
              raw?: {
                // eslint-disable-next-line no-unused-vars
                setHeader?: (_name: string, _value: string) => void;
              };
            }
          ).raw?.setHeader
        ) {
          (
            res as {
              raw: {
                // eslint-disable-next-line no-unused-vars
                setHeader: (_name: string, _value: string) => void;
              };
            }
          ).raw.setHeader('X-Correlation-ID', correlationId);
        }
      } catch {
        // If setting header fails, continue anyway - correlation ID is still in request
        // This shouldn't break the request
      }

      next();
    } catch {
      // If middleware fails completely, still call next to avoid hanging requests
      // The exception filter will handle any errors
      next();
    }
  }
}
