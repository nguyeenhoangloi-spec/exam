import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DashboardService } from './dashboard.service';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
@Permissions('SYSTEM_REPORT_VIEW')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('overview')
  overview() {
    return this.dashboard.overview();
  }
}
