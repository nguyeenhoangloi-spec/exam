import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP-ERROR');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorMessage =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? JSON.stringify(exceptionResponse)
        : exceptionResponse;

    const logMessage = `\x1b[31m[${request.method}] ${request.url} - Status ${status} - Error: ${errorMessage}\x1b[0m`;

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : '';
      this.logger.error(logMessage, stack);
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json(
      typeof exceptionResponse === 'object'
        ? exceptionResponse
        : {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: exceptionResponse,
          },
    );
  }
}
