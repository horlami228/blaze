import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // ✅ Generate unique request ID for tracking
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // Attach to request object
    (req as any).id = requestId;

    // Send back to client for support tickets
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
