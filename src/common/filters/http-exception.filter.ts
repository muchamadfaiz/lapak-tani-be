import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    private readonly appCfg: { nodeEnv: string },
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          message = 'Validation failed';
          errors = resObj.message;
        } else {
          message = resObj.message || message;
        }
      } else if (typeof res === 'string') {
        message = res;
      }
    }

    // Log server errors (5xx) with full stack trace
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${statusCode} - ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (statusCode >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} ${statusCode} - ${message}`,
      );
    }

    const body: Record<string, any> = {
      status: false,
      statusCode,
      message,
    };

    if (errors) {
      body.errors = errors;
    }

    if (
      this.appCfg.nodeEnv === 'development' &&
      exception instanceof Error
    ) {
      body.stack = exception.stack;
    }

    response.status(statusCode).json(body);
  }
}
