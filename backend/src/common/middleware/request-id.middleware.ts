import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Attaches a unique request ID to every incoming request.
 * - Uses X-Request-ID header if provided (for distributed tracing)
 * - Otherwise generates a new UUID
 * - Exposes the ID in response headers for client correlation
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req.headers['x-correlation-id'] as string) ||
      randomUUID();

    (req as any).id = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
