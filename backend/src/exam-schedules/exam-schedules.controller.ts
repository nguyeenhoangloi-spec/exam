import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ExamSchedulesService } from './exam-schedules.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AutoScheduleAcceptDto, AutoSchedulePreviewDto, CreateExamScheduleDto, FindExamSchedulesDto, ReopenEntryDto, UpdateExamScheduleDto } from './dto/exam-schedule.dto';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
@Permissions('EXAM_SCHEDULE_MANAGE')
@Controller('exam-schedules')
export class ExamSchedulesController {
  constructor(private readonly examSchedulesService: ExamSchedulesService) {}

  @Get()
  @Roles('ADMIN', 'TEACHER')
  findAll(@Request() req: any, @Query() query: FindExamSchedulesDto) {
    return this.examSchedulesService.findAll(req.user, query.examPeriodId, query.mode);
  }

  @Get('conflicts')
  @Roles('ADMIN')
  conflicts(@Query() query: FindExamSchedulesDto) {
    return this.examSchedulesService.conflicts(query.examPeriodId);
  }

  @Get('trash')
  @Roles('ADMIN')
  trash(@Request() req: any, @Query() query: FindExamSchedulesDto) {
    return this.examSchedulesService.findTrash(req.user, query.examPeriodId);
  }

  @Post('auto-preview')
  @Roles('ADMIN')
  autoPreview(@Body() body: AutoSchedulePreviewDto) {
    return this.examSchedulesService.previewAutoSchedule(body.examPeriodId, body.subjectIds);
  }

  @Post('auto-apply')
  @Roles('ADMIN')
  autoApply(@Request() req: any, @Body() body: AutoScheduleAcceptDto) {
    return this.examSchedulesService.acceptAutoSchedule(req.user, body.proposals);
  }

  @Post(':id/lock')
  @Roles('ADMIN')
  lock(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examSchedulesService.update(req.user, id, { status: 'LOCKED' });
  }

  @Post(':id/unlock')
  @Roles('ADMIN')
  unlock(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examSchedulesService.update(req.user, id, { status: 'SCHEDULED' }, true);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examSchedulesService.findOne(req.user, id);
  }

  @Roles('ADMIN', 'TEACHER')
  @Post()
  create(@Request() req: any, @Body() body: CreateExamScheduleDto) {
    return this.examSchedulesService.create(req.user, body);
  }

  @Roles('ADMIN', 'TEACHER')
  @Patch(':id')
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateExamScheduleDto) {
    return this.examSchedulesService.update(req.user, id, body);
  }

  @Roles('ADMIN', 'TEACHER')
  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examSchedulesService.remove(req.user, id);
  }

  @Post(':id/reopen-entry')
  @Roles('ADMIN', 'TEACHER')
  reopenEntry(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: ReopenEntryDto) {
    return this.examSchedulesService.reopenEntry(req.user, id, body.minutes ?? 60);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  restore(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examSchedulesService.restore(req.user, id);
  }
}
