import { Controller, Get, Param, ParseIntPipe, Query, Request, UseGuards, Post, Put, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ExamArchivesService, ArchiveFilterDto } from './exam-archives.service';
import { ExamArchivesConfigService } from './exam-archives-config.service';
import { SecurityAuditEvent } from '../security-audit/security-audit-event.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TEACHER')
@Controller('exam-archives')
export class ExamArchivesController {
  constructor(
    private readonly service: ExamArchivesService,
    private readonly configService: ExamArchivesConfigService,
  ) {}

  @Get('config')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ARCHIVES_CONFIG_VIEWED', entityType: 'EXAM_ARCHIVE_CONFIG' })
  getConfig() {
    return this.configService.getConfig();
  }

  @Put('config')
  @Roles('ADMIN')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ARCHIVES_CONFIG_UPDATED', entityType: 'EXAM_ARCHIVE_CONFIG' })
  updateConfig(@Request() req: any, @Body() dto: { retentionYears: number }) {
    return this.configService.updateConfig(dto, req.user);
  }

  @Get('summary')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ARCHIVES_SUMMARY_VIEWED', entityType: 'EXAM_ARCHIVE' })
  getSummary(@Request() req: any) {
    return this.service.getArchiveSummary(req.user);
  }

  @Get('filter-options')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ARCHIVES_FILTER_OPTIONS_VIEWED', entityType: 'EXAM_ARCHIVE' })
  getFilterOptions(@Request() req: any) {
    return this.service.getFilterOptions(req.user);
  }

  @Get('schedules')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ARCHIVED_SCHEDULES_VIEWED', entityType: 'EXAM_ARCHIVE' })
  getSchedules(@Request() req: any, @Query() query: ArchiveFilterDto) {
    return this.service.getArchivedSchedules(req.user, query);
  }

  @Get('schedules/:scheduleId/attempts')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ARCHIVED_ATTEMPTS_VIEWED', entityType: 'EXAM_ARCHIVE' })
  getAttempts(
    @Request() req: any,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Query() query: ArchiveFilterDto,
  ) {
    return this.service.getArchivedAttempts(req.user, scheduleId, query);
  }

  @Get('schedules/:scheduleId/batch-dossier')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ARCHIVED_BATCH_DOSSIER_EXTRACTED', entityType: 'EXAM_ARCHIVE' })
  getBatchDossier(
    @Request() req: any,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
  ) {
    return this.service.getBatchArchivedDossier(req.user, scheduleId);
  }

  @Get('schedules/:scheduleId/disposal-proposal')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ARCHIVED_DISPOSAL_PROPOSAL_VIEWED', entityType: 'EXAM_ARCHIVE' })
  getDisposalProposal(
    @Request() req: any,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
  ) {
    return this.service.getDisposalProposal(req.user, scheduleId);
  }

  @Get('attempts/:attemptId')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ARCHIVE_ATTEMPT_DETAIL_VIEWED', entityType: 'EXAM_ARCHIVE' })
  getAttemptDetail(@Request() req: any, @Param('attemptId') attemptId: string) {
    return this.service.getArchivedAttemptDetail(req.user, attemptId);
  }

  @Post('attempts/:attemptId/verify')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ARCHIVE_INTEGRITY_VERIFIED', entityType: 'EXAM_ARCHIVE' })
  verifyIntegrity(@Request() req: any, @Param('attemptId') attemptId: string) {
    return this.service.verifyAttemptIntegrity(req.user, attemptId);
  }
}
