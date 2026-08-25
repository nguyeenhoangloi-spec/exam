import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AccessControlService } from './access-control.service';
import { AccessPolicyService } from './access-policy.service';
import { PermissionGuard } from './permission.guard';
import { Permissions } from './permissions.decorator';
import { SecurityAuditEvent } from '../security-audit/security-audit-event.decorator';
import {
  ReplaceUserScopesDto,
  SimulatePermissionDto,
  UpdateRolePermissionDto,
  UpdateRolePermissionsBatchDto,
  UpsertUserPermissionOverrideDto,
} from './dto/access-control.dto';

@Controller('access-control')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
export class AccessControlController {
  constructor(
    private readonly accessControl: AccessControlService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  @Get('me/effective')
  @Roles('ADMIN', 'TEACHER', 'STUDENT')
  currentUserEffective(@Request() req: any) {
    return this.accessControl.getEffectivePermissions(req.user.id);
  }

  @Get('overview')
  @Permissions('ACCESS_CONTROL_VIEW')
  @SecurityAuditEvent({ category: 'AUTHORIZATION', action: 'ACCESS_CONTROL_OVERVIEW_VIEWED', entityType: 'ACCESS_CONTROL' })
  getOverview() { return this.accessControl.getOverview(); }

  @Get('users')
  @Permissions('ACCESS_CONTROL_VIEW')
  listUsers() { return this.accessControl.listUsers(); }

  @Get('scope-options')
  @Permissions('ACCESS_CONTROL_VIEW')
  scopeOptions() { return this.accessControl.getScopeOptions(); }

  @Get('history')
  @Permissions('ACCESS_CONTROL_VIEW')
  @SecurityAuditEvent({ category: 'AUTHORIZATION', action: 'ACCESS_CONTROL_HISTORY_VIEWED', entityType: 'ACCESS_CONTROL' })
  history(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit);
    return this.accessControl.getHistory(Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 100);
  }

  @Get('users/:userId/effective')
  @Permissions('ACCESS_CONTROL_VIEW')
  @SecurityAuditEvent({ category: 'AUTHORIZATION', action: 'USER_EFFECTIVE_PERMISSIONS_VIEWED', entityType: 'USER', entityIdParam: 'userId' })
  effective(@Param('userId', ParseIntPipe) userId: number) { return this.accessControl.getEffectivePermissions(userId); }

  @Put('roles/:role/permissions')
  @Permissions('ACCESS_CONTROL_MANAGE')
  setRolePermission(@Request() req: any, @Param('role') role: string, @Body() dto: UpdateRolePermissionDto) {
    return this.accessControl.setRolePermission(req.user, role.toUpperCase(), dto.permissionCode, dto.granted, dto.reason);
  }

  @Put('roles/:role/permissions/batch')
  @Permissions('ACCESS_CONTROL_MANAGE')
  setRolePermissionsBatch(
    @Request() req: any,
    @Param('role') role: string,
    @Body() dto: UpdateRolePermissionsBatchDto,
  ) {
    return this.accessControl.setRolePermissionsBatch(req.user, role.toUpperCase(), dto);
  }

  @Post('simulate')
  @Permissions('ACCESS_CONTROL_VIEW')
  async simulate(@Body() dto: SimulatePermissionDto) {
    const effective = await this.accessControl.getEffectivePermissions(dto.userId);
    return this.accessPolicy.explain(effective.user, dto.permissionCode, dto.context);
  }

  @Post('roles/:role/reset')
  @Permissions('ACCESS_CONTROL_MANAGE')
  resetRolePermissions(@Request() req: any, @Param('role') role: string) {
    return this.accessControl.resetRolePermissions(req.user, role.toUpperCase());
  }

  @Put('users/:userId/overrides')
  @Permissions('ACCESS_CONTROL_MANAGE')
  setOverride(@Request() req: any, @Param('userId', ParseIntPipe) userId: number, @Body() dto: UpsertUserPermissionOverrideDto) {
    return this.accessControl.upsertUserOverride(req.user, userId, dto);
  }

  @Delete('users/:userId/overrides/:permissionCode')
  @Permissions('ACCESS_CONTROL_MANAGE')
  removeOverride(@Request() req: any, @Param('userId', ParseIntPipe) userId: number, @Param('permissionCode') permissionCode: string) {
    return this.accessControl.removeUserOverride(req.user, userId, permissionCode);
  }

  @Delete('users/:userId/overrides')
  @Permissions('ACCESS_CONTROL_MANAGE')
  removeAllOverrides(@Request() req: any, @Param('userId', ParseIntPipe) userId: number) {
    return this.accessControl.removeAllUserOverrides(req.user, userId);
  }

  @Put('users/:userId/scopes')
  @Permissions('ACCESS_CONTROL_MANAGE')
  setScopes(@Request() req: any, @Param('userId', ParseIntPipe) userId: number, @Body() dto: ReplaceUserScopesDto) {
    return this.accessControl.replaceUserScopes(req.user, userId, dto);
  }

  @Delete('users/:userId/scopes')
  @Permissions('ACCESS_CONTROL_MANAGE')
  resetScopes(@Request() req: any, @Param('userId', ParseIntPipe) userId: number) {
    return this.accessControl.resetUserScopes(req.user, userId);
  }

  @Post('users/:userId/reset')
  @Permissions('ACCESS_CONTROL_MANAGE')
  resetUserAccess(@Request() req: any, @Param('userId', ParseIntPipe) userId: number) {
    return this.accessControl.resetUserAccess(req.user, userId);
  }
}
