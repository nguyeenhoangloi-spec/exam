import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessPolicyService } from './access-policy.service';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { SecurityAuditService } from '../security-audit/security-audit.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policy: AccessPolicyService,
    private readonly securityAudit: SecurityAuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    try {
      return await this.policy.assertAnyPermission(request.user, required);
    } catch (error) {
      await this.securityAudit.write({
        category: 'AUTHORIZATION', action: 'PERMISSION_DENIED', outcome: 'DENIED', actor: request.user,
        entityType: 'HTTP_ROUTE', entityId: `${request.method}:${request.baseUrl || ''}${request.path || ''}`,
        metadata: { requiredPermissions: required },
      });
      throw error;
    }
  }
}
