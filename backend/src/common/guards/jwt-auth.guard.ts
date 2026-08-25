import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SecurityAuditService } from '../../security-audit/security-audit.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityAudit: SecurityAuditService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    return isPublic ? true : super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context?: ExecutionContext) {
    if (err || !user) {
      const request = context?.switchToHttp().getRequest();
      void this.securityAudit.write({
        category: 'AUTHENTICATION',
        action: 'SESSION_ACCESS_DENIED',
        outcome: 'DENIED',
        entityType: 'HTTP_ROUTE',
        entityId: request ? `${request.method}:${request.baseUrl || ''}${request.path || ''}` : 'UNKNOWN',
        metadata: { reason: info?.name || 'INVALID_OR_EXPIRED_SESSION' },
      }).catch(() => undefined);
      throw err || new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }
    return user;
  }
}
