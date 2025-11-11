import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    // Generate correlation ID or use existing one from headers
    const correlationId =
      (req.headers['x-correlation-id'] as string) || uuidv4();

    // Attach correlation ID to request object
    (req as any).correlationId = correlationId;

    // Set correlation ID in response headers
    res.header('X-Correlation-ID', correlationId);

    next();
  }
}

