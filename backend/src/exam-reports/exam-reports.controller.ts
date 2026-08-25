import { Body, Controller, Get, HttpCode, Post, Query, Request, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { ExamReportsService } from './exam-reports.service';
import { ExamReportExportDto, ExamReportPreviewDto } from './dto/report-request.dto';
import { SecurityAuditEvent } from '../security-audit/security-audit-event.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN', 'TEACHER')
@Permissions('EXAM_REPORT_VIEW')
@Controller('exam-reports')
export class ExamReportsController {
  constructor(private readonly service: ExamReportsService) {}

  @Get('summary')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_REPORT_SUMMARY_VIEWED', entityType: 'EXAM_REPORT' })
  getSummary(@Request() req: any, @Query() query: Record<string, string>) {
    return this.service.getSummary(req.user, query);
  }

  @Get('schedules')
  getSchedules(@Request() req: any) {
    return this.service.getSchedules(req.user);
  }

  @Get('catalog')
  getCatalog() {
    return this.service.getCatalog();
  }

  @Post('preview')
  @HttpCode(200)
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_REPORT_PREVIEWED', entityType: 'EXAM_REPORT' })
  preview(@Request() req: any, @Body() dto: ExamReportPreviewDto) {
    return this.service.preview(req.user, dto);
  }

  @Post('export')
  @HttpCode(200)
  @Permissions('EXAM_REPORT_EXPORT')
  async export(
    @Request() req: any,
    @Body() dto: ExamReportExportDto,
    @Res() response: Response,
  ) {
    const file = await this.service.export(req.user, dto);
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`);
    response.setHeader('Cache-Control', 'no-store');
    response.send(file.buffer);
  }
}
