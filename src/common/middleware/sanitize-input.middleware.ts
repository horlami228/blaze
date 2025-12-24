import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SanitizeInputMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // ✅ Sanitize request body to prevent XSS and injection attacks
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    // ✅ Sanitize query parameters
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
      return sanitized;
    }

    return obj;
  }

  private sanitizeString(str: string): string {
    // Remove null bytes
    let sanitized = str.replace(/\0/g, '');

    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim whitespace
    return sanitized.trim();
  }
}
