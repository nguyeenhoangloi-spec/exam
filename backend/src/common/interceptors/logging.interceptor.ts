import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request } from 'express';
import { signUploadPath } from '../security/file-signing';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  private safeUrl(url: string) {
    return url
      .replace(/([?&](?:token|code|access_token|id_token|google_token)=)[^&]+/gi, '$1[redacted]')
      .replace(/\/attempt\/[^/]+/gi, '/attempt/[redacted]');
  }

  private redact(value: any): any {
    if (Array.isArray(value)) return value.map((item) => this.redact(item));
    if (!value || typeof value !== 'object') return value;
    // Preserve special response values. Recursing into Date turns it into {}
    // because Date has no enumerable properties, breaking date rendering on
    // the client (for example, NaN/NaN/NaN).
    if (value instanceof Date || Buffer.isBuffer(value)) return value;
    const result: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) {
      if (/^(password|tokenHash|sessionToken|examPasswordHash|clientSecret|apiKey)$/i.test(key)) continue;
      result[key] = this.redact(item);
    }
    return result;
  }

  private signFiles(value: any): any {
    if (Array.isArray(value)) return value.map((item) => this.signFiles(item));
    if (typeof value === 'string') {
      return value.replace(/\/uploads\/[^\s"'<>`)]+/g, (path) => {
        if (path.includes('?exp=') || path.includes('&exp=')) return path;
        return signUploadPath(path);
      });
    }
    if (!value || typeof value !== 'object') return value;
    if (value instanceof Date || Buffer.isBuffer(value)) return value;
    const result: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) result[key] = this.signFiles(item);
    return result;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method } = req;
    const url = this.safeUrl(req.originalUrl || req.url);
    const now = Date.now();

    return next.handle().pipe(
      map((value) => this.signFiles(this.redact(value))),
      tap(() => {
        const delay = Date.now() - now;
        this.logger.log(`[${method}] ${url} - Finished in ${delay}ms`);
      }),
    );
  }
}
