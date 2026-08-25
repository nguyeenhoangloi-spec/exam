import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SecurityAuditOutcome } from '@prisma/client';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SecurityAuditService } from './security-audit.service';
import { SECURITY_AUDIT_EVENT, SecurityAuditEventOptions } from './security-audit-event.decorator';

@Injectable()
export class SecurityAuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.getAllAndOverride<SecurityAuditEventOptions>(SECURITY_AUDIT_EVENT, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) return next.handle();

    const request = context.switchToHttp().getRequest<any>();
    const actor = request.user;
    const entityId = options.entityIdParam ? request.params?.[options.entityIdParam] : undefined;
    const record = (outcome: SecurityAuditOutcome, metadata?: Record<string, string | number | boolean | null>) => {
      if (!actor?.id) return;
      void this.securityAudit.write({
        category: options.category,
        action: options.action,
        outcome,
        actor,
        entityType: options.entityType,
        entityId,
        metadata: { ...options.metadata, ...metadata },
      }).catch(() => undefined);
    };

    return next.handle().pipe(
      tap(() => record('SUCCESS')),
      catchError((error) => {
        const status = error instanceof HttpException ? error.getStatus() : 500;
        if (status === 401 || status === 403) record('DENIED', { status });
        else if (status >= 500) record('FAILURE', { status });
        return throwError(() => error);
      }),
    );
  }
}
