import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { SecurityAuditCategory } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateLegalHoldDto, SecurityAuditQueryDto, UpdateRetentionPolicyDto } from './dto/security-audit.dto';
import { SecurityAuditService } from './security-audit.service';

@Controller('security-audit')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
export class SecurityAuditController {
  constructor(private readonly service: SecurityAuditService) {}

  @Get('events')
  @Permissions('SECURITY_AUDIT_VIEW')
  list(@Query() query: SecurityAuditQueryDto) { return this.service.list(query); }

  @Get('policies')
  @Permissions('SECURITY_AUDIT_VIEW')
  policies() { return this.service.policies(); }

  @Get('integrity')
  @Permissions('SECURITY_AUDIT_VIEW')
  verifyIntegrity(@Query('limit') limit?: string) { return this.service.verifyIntegrity(Number(limit || 5000)); }

  @Get('archive-status')
  @Permissions('SECURITY_AUDIT_VIEW')
  archiveStatus() { return this.service.archiveStatus(); }

  @Patch('policies/:category')
  @Permissions('SECURITY_AUDIT_MANAGE')
  updatePolicy(@Param('category') category: SecurityAuditCategory, @Body() dto: UpdateRetentionPolicyDto, @Request() req: any) {
    return this.service.updatePolicy(category, dto, req.user.id || req.user.sub);
  }

  @Post('events/:id/legal-hold')
  @Permissions('SECURITY_AUDIT_MANAGE')
  createHold(@Param('id') id: string, @Body() dto: CreateLegalHoldDto, @Request() req: any) {
    return this.service.createLegalHold(id, dto, req.user.id || req.user.sub);
  }

  @Post('events/:id/release-legal-hold')
  @Permissions('SECURITY_AUDIT_MANAGE')
  releaseHold(@Param('id') id: string, @Request() req: any) {
    return this.service.releaseLegalHold(id, req.user.id || req.user.sub);
  }
}
