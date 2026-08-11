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

  private safeUrl(url: string) {
    return url
      .replace(/([?&](?:token|code|access_token|id_token|google_token)=)[^&]+/gi, '$1[redacted]')
      .replace(/\/attempt\/[^/]+/gi, '/attempt/[redacted]');
  }

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
        : { statusCode: 500, message: exception instanceof Error ? exception.message : 'Hệ thống đã xảy ra lỗi không xác định.' };

    const errorMessage =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? JSON.stringify(exceptionResponse)
        : exceptionResponse;

    const logMessage = `\x1b[31m[${request.method}] ${this.safeUrl(request.originalUrl || request.url)} - Status ${status} - Error: ${errorMessage}\x1b[0m`;

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : '';
      this.logger.error(logMessage, stack);
    } else {
      this.logger.warn(logMessage);
    }

    const safeResponse = status >= 500
      ? { statusCode: status, message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.' }
      : exceptionResponse;
    response.status(status).json(
      typeof safeResponse === 'object'
        ? safeResponse
        : { statusCode: status, timestamp: new Date().toISOString(), path: this.safeUrl(request.originalUrl || request.url), message: safeResponse },
    );
  }
}
