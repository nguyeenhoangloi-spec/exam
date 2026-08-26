import { Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards, Body } from '@nestjs/common';
import { BackupJobStatus, BackupJobType } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BackupService } from './backup.service';
import { ApproveRestoreRequestDto, CreateBackupJobDto, CreateRestoreRequestDto, RejectRestoreRequestDto } from './dto/backup.dto';
import { CompleteGoogleDriveConnectionDto, UpdateBackupSettingsDto, UpsertBackupStorageTargetDto } from './dto/backup-settings.dto';
import { SecurityAuditEvent } from '../security-audit/security-audit-event.decorator';

@Controller('backups')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
@Permissions('BACKUP_MANAGE')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('overview')
  @SecurityAuditEvent({ category: 'BACKUP_RECOVERY', action: 'BACKUP_OVERVIEW_VIEWED', entityType: 'BACKUP_SYSTEM' })
  overview() {
    return this.backupService.overview();
  }

  @Get('settings')
  @SecurityAuditEvent({ category: 'BACKUP_RECOVERY', action: 'BACKUP_SETTINGS_VIEWED', entityType: 'BACKUP_SETTINGS' })
  getSettings() {
    return this.backupService.getSettings();
  }

  @Put('settings')
  updateSettings(@Request() req: any, @Body() dto: UpdateBackupSettingsDto) {
    return this.backupService.updateSettings(dto, req.user);
  }

  @Post('storage-targets')
  createStorageTarget(@Request() req: any, @Body() dto: UpsertBackupStorageTargetDto) {
    return this.backupService.createStorageTarget(dto, req.user);
  }

  @Put('storage-targets/:id')
  updateStorageTarget(@Request() req: any, @Param('id') id: string, @Body() dto: UpsertBackupStorageTargetDto) {
    return this.backupService.updateStorageTarget(id, dto, req.user);
  }

  @Delete('storage-targets/:id')
  deleteStorageTarget(@Request() req: any, @Param('id') id: string) {
    return this.backupService.deleteStorageTarget(id, req.user);
  }

  @Post('storage-targets/:id/test')
  testStorageTarget(@Request() req: any, @Param('id') id: string) {
    return this.backupService.testStorageTarget(id, req.user);
  }

  @Post('storage-targets/:id/google-drive/authorize')
  authorizeGoogleDrive(@Request() req: any, @Param('id') id: string) {
    return this.backupService.getGoogleDriveAuthorization(id, req.user);
  }

  @Post('storage-targets/:id/google-drive/complete')
  completeGoogleDrive(@Request() req: any, @Param('id') id: string, @Body() dto: CompleteGoogleDriveConnectionDto) {
    return this.backupService.completeGoogleDriveConnection(id, dto.code, dto.state, req.user);
  }

  @Get('jobs')
  listJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: BackupJobType,
    @Query('status') status?: BackupJobStatus,
    @Query('isScheduled') isScheduled?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('search') search?: string,
  ) {
    return this.backupService.listJobs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      type,
      status,
      isScheduled: isScheduled !== undefined && isScheduled !== '' ? isScheduled === 'true' : undefined,
      fromDate,
      toDate,
      search,
    });
  }

  @Get('jobs/:id')
  @SecurityAuditEvent({ category: 'BACKUP_RECOVERY', action: 'BACKUP_JOB_VIEWED', entityType: 'BACKUP_JOB', entityIdParam: 'id' })
  getJob(@Param('id') id: string) {
    return this.backupService.getJob(id);
  }

  @Get('restore-requests')
  listRestoreRequests() {
    return this.backupService.listRestoreRequests();
  }

  @Post('jobs')
  createJob(@Request() req: any, @Body() dto: CreateBackupJobDto) {
    return this.backupService.createJob(req.user.id, dto);
  }

  @Post('restore-requests')
  createRestoreRequest(@Request() req: any, @Body() dto: CreateRestoreRequestDto) {
    return this.backupService.createRestoreRequest(req.user.id, dto);
  }

  @Post('restore-requests/:id/approve')
  approveRestoreRequest(@Request() req: any, @Param('id') id: string, @Body() dto: ApproveRestoreRequestDto) {
    return this.backupService.approveRestoreRequest(req.user.id, id, dto);
  }

  @Post('restore-requests/:id/reject')
  rejectRestoreRequest(@Request() req: any, @Param('id') id: string, @Body() dto: RejectRestoreRequestDto) {
    return this.backupService.rejectRestoreRequest(req.user.id, id, dto);
  }
}
