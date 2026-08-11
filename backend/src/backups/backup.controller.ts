import { Controller, Get, Param, Post, Query, Request, UseGuards, Body } from '@nestjs/common';
import { BackupJobStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BackupService } from './backup.service';
import { ApproveRestoreRequestDto, CreateBackupJobDto, CreateRestoreRequestDto, RejectRestoreRequestDto } from './dto/backup.dto';

@Controller('backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('overview')
  overview() {
    return this.backupService.overview();
  }

  @Get('jobs')
  listJobs(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: BackupJobStatus) {
    return this.backupService.listJobs(Number(page || 1), Number(limit || 20), status);
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
