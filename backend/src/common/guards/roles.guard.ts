import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SecurityAuditService } from '../../security-audit/security-audit.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private readonly securityAudit?: SecurityAuditService) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !requiredRoles.includes(user.role)) {
      const request = context.switchToHttp().getRequest();
      void this.securityAudit?.write({ category: 'AUTHORIZATION', action: 'ROLE_DENIED', outcome: 'DENIED', actor: user, entityType: 'HTTP_ROUTE', entityId: `${request.method}:${request.path}`, metadata: { requiredRoles } });
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    }
    return true;
  }
}
