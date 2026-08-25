import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateSupervisorChangeRequestDto, CreateTeacherDto, ReviewSupervisorChangeRequestDto, UpdateDutyAvailabilityDto, UpdateTeacherDto } from './dto/teacher.dto';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { SecurityAuditEvent } from '../security-audit/security-audit-event.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Roles('TEACHER')
  @Permissions('PROCTOR_ASSIGNMENT_VIEW')
  @Get('my-assignments')
  getMyAssignments(@Request() req: any) {
    return this.teachersService.getMyAssignments(req.user.id);
  }

  @Roles('TEACHER')
  @Permissions('PROCTOR_ASSIGNMENT_VIEW')
  @Patch('my-assignments/:id/status')
  updateAssignmentStatus(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string; note?: string },
  ) {
    return this.teachersService.updateAssignmentStatus(req.user.id, id, body.status, body.note);
  }

  @Post('my-assignments/:id/confirm')
  @Roles('TEACHER')
  @Permissions('PROCTOR_ASSIGNMENT_VIEW')
  confirmMyAssignment(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.teachersService.confirmMyAssignment(req.user.id, id);
  }

  @Post('my-assignments/:id/change-requests')
  @Roles('TEACHER')
  @Permissions('PROCTOR_ASSIGNMENT_VIEW')
  requestAssignmentChange(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: CreateSupervisorChangeRequestDto) {
    return this.teachersService.requestAssignmentChange(req.user.id, id, body.reason);
  }

  @Get('my-duty-availability')
  @Roles('TEACHER')
  @Permissions('PROCTOR_ASSIGNMENT_VIEW')
  getMyDutyAvailability(@Request() req: any) {
    return this.teachersService.getMyDutyAvailability(req.user.id);
  }

  @Patch('my-duty-availability')
  @Roles('TEACHER')
  @Permissions('PROCTOR_ASSIGNMENT_VIEW')
  updateMyDutyAvailability(@Request() req: any, @Body() body: UpdateDutyAvailabilityDto) {
    return this.teachersService.updateMyDutyAvailability(req.user.id, body);
  }

  @Get('supervisor-change-requests')
  @Roles('ADMIN')
  @Permissions('EXAM_SUPERVISOR_MANAGE')
  getSupervisorChangeRequests(@Request() _req: any) {
    return this.teachersService.getSupervisorChangeRequests();
  }

  @Get('supervisor-change-requests/:id/eligible-replacements')
  @Roles('ADMIN')
  @Permissions('EXAM_SUPERVISOR_MANAGE')
  getEligibleReplacementTeachers(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.getEligibleReplacementTeachers(id);
  }

  @Post('supervisor-change-requests/:id/approve')
  @Roles('ADMIN')
  @Permissions('EXAM_SUPERVISOR_MANAGE')
  approveSupervisorChange(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: ReviewSupervisorChangeRequestDto) {
    return this.teachersService.approveSupervisorChange(req.user, id, body.replacementTeacherId, body.reviewNote);
  }

  @Post('supervisor-change-requests/:id/reject')
  @Roles('ADMIN')
  @Permissions('EXAM_SUPERVISOR_MANAGE')
  rejectSupervisorChange(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: ReviewSupervisorChangeRequestDto) {
    return this.teachersService.rejectSupervisorChange(req.user, id, body.reviewNote);
  }

  @Roles('TEACHER')
  @Permissions('PROCTOR_ASSIGNMENT_VIEW')
  @Get('my-assignments/:id/attendance-sheet')
  @SecurityAuditEvent({ category: 'DATA_EXPORT', action: 'ATTENDANCE_SHEET_VIEWED', entityType: 'PROCTOR_ASSIGNMENT', entityIdParam: 'id' })
  getAttendanceSheet(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.teachersService.getAttendanceSheet(req.user.id, id);
  }

  @Get()
  @Permissions('USER_MANAGE')
  findAll() {
    return this.teachersService.findAll();
  }

  @Post(':id/lock')
  @Permissions('USER_MANAGE')
  lock(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.teachersService.setLock(req.user, id, true);
  }

  @Post(':id/unlock')
  @Permissions('USER_MANAGE')
  unlock(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.teachersService.setLock(req.user, id, false);
  }

  @Get(':id')
  @Permissions('USER_MANAGE')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.findOne(id);
  }

  @Roles('ADMIN')
  @Permissions('USER_MANAGE')
  @Post()
  create(@Body() body: CreateTeacherDto) {
    return this.teachersService.create(body);
  }

  @Roles('ADMIN')
  @Permissions('USER_MANAGE')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateTeacherDto) {
    return this.teachersService.update(id, body);
  }

  @Roles('ADMIN')
  @Permissions('USER_MANAGE')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.remove(id);
  }
}
