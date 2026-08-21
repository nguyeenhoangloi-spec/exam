import { Controller, Get, Param, Post, Put, Query, Request, UseGuards, Body } from '@nestjs/common';
import { BackupJobStatus, BackupJobType } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BackupService } from './backup.service';
import { ApproveRestoreRequestDto, CreateBackupJobDto, CreateRestoreRequestDto, RejectRestoreRequestDto } from './dto/backup.dto';
import { UpdateBackupSettingsDto } from './dto/backup-settings.dto';

@Controller('backups')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
@Permissions('BACKUP_MANAGE')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('overview')
  overview() {
    return this.backupService.overview();
  }

  @Get('settings')
  getSettings() {
    return this.backupService.getSettings();
  }

  @Put('settings')
  updateSettings(@Request() req: any, @Body() dto: UpdateBackupSettingsDto) {
    return this.backupService.updateSettings(dto, req.user);
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
