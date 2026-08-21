import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { ExamReportsService } from './exam-reports.service';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN', 'TEACHER')
@Permissions('EXAM_REPORT_VIEW')
@Controller('exam-reports')
export class ExamReportsController {
  constructor(private readonly service: ExamReportsService) {}

  @Get('summary')
  getSummary(@Request() req: any, @Query() query: Record<string, string>) {
    return this.service.getSummary(req.user, query);
  }

  @Get('schedules')
  getSchedules(@Request() req: any) {
    return this.service.getSchedules(req.user);
  }
}
