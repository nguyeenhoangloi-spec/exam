import { Module } from '@nestjs/common';
import { AccessControlController } from './access-control.controller';
import { AccessControlService } from './access-control.service';
import { AccessPolicyService } from './access-policy.service';
import { PermissionGuard } from './permission.guard';

@Module({
  controllers: [AccessControlController],
  providers: [AccessControlService, AccessPolicyService, PermissionGuard],
  exports: [AccessControlService, AccessPolicyService, PermissionGuard],
})
export class AccessControlModule {}
