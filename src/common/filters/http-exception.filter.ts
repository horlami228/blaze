import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isDevelopment = process.env.NODE_ENV !== 'production';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const detailedMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any)?.message || 'Unknown error';

    // ✅ Sanitize message to prevent log injection attacks
    const sanitizedMessage = this.sanitizeLogMessage(detailedMessage);

    // ✅ Get client IP safely
    const clientIp = this.getClientIp(request);

    // Log with full context (backend only - always verbose)
    const logContext = {
      statusCode: status,
      path: request.url,
      method: request.method,
      message: sanitizedMessage,
      userId: (request as any).user?.sub,
      requestId: (request as any).id,
      ip: clientIp,
      userAgent: request.headers['user-agent'],
      // Include the full response details in the backend logs
      errorDetails:
        typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
    };

    if (status >= 500) {
      // Server errors - always log with stack trace
      this.logger.error(
        {
          ...logContext,
          stack: exception instanceof Error ? exception.stack : undefined,
          errorName:
            exception instanceof Error ? exception.name : 'UnknownError',
        },
        `Server Error: ${sanitizedMessage}`,
      );
    } else {
      // Client errors - log as warning
      this.logger.warn(logContext, `Client Error: ${sanitizedMessage}`);
    }

    // ✅ Prepare client response based on environment
    const responseBody = this.buildResponse(
      status,
      detailedMessage,
      request,
      exception,
      isDevelopment,
    );

    response.status(status).json(responseBody);
  }

  /**
   * Sanitize log message to prevent log injection attacks
   */
  private sanitizeLogMessage(message: any): string {
    const messageStr = String(message);

    // Remove newlines and carriage returns to prevent log injection
    // Limit length to prevent log flooding
    return messageStr
      .replace(/[\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500);
  }

  /**
   * Safely extract client IP address
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Build response body based on environment and status code
   */
  private buildResponse(
    status: number,
    detailedMessage: string,
    request: Request,
    exception: unknown,
    isDevelopment: boolean,
  ): any {
    const baseResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      requestId: (request as any).id, // ✅ For support tickets and log correlation
    };

    if (isDevelopment) {
      // DEVELOPMENT: Return detailed errors for debugging
      // If the original exception response is an object (like DTO errors), merge it
      const originalError =
        exception instanceof HttpException ? exception.getResponse() : {};

      return {
        ...baseResponse,
        message: detailedMessage,
        // In dev, if the original error was an object (e.g. DTO validation array), show it
        ...(typeof originalError === 'object' ? originalError : {}),
        path: request.url,
        method: request.method,
        ...(status >= 500 && {
          stack: exception instanceof Error ? exception.stack : undefined,
          errorName: exception instanceof Error ? exception.name : undefined,
        }),
      };
    }

    // PRODUCTION: Return generic messages - prevent information leakage
    const genericMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Authentication failed. Please check your credentials.',
      403: 'Access denied.',
      404: 'Resource not found.',
      409: 'Request could not be completed.',
      422: 'Unable to process request.',
      429: 'Too many requests. Please try again later.',
      500: 'An error occurred. Please try again later.',
      502: 'Service temporarily unavailable.',
      503: 'Service temporarily unavailable.',
      504: 'Request timeout. Please try again.',
    };

    return {
      ...baseResponse,
      message: genericMessages[status] || genericMessages[500],
      // ✅ Include retry-after header for rate limiting
      ...(status === 429 && {
        retryAfter: 60,
      }),
    };
  }
}
