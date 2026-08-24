import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles('STUDENT')
  @Permissions('STUDENT_SCHEDULE_VIEW')
  @Get('my-schedule')
  getMySchedule(@Request() req: any) {
    return this.studentsService.getPersonalSchedule(req.user.id);
  }

  @Roles('STUDENT')
  @Permissions('STUDENT_CURRICULUM_VIEW')
  @Get('my-curriculum')
  getMyCurriculum(@Request() req: any) {
    return this.studentsService.getPersonalCurriculum(req.user.id);
  }

  @Roles('STUDENT')
  @Permissions('STUDENT_RESULT_VIEW')
  @Get('my-results')
  getMyResults(@Request() req: any) {
    return this.studentsService.getPersonalResults(req.user.id);
  }

  @Roles('STUDENT')
  @Permissions('STUDENT_RESULT_VIEW')
  @Post('my-results/:attemptId/appeal')
  requestAppeal(@Request() req: any, @Param('attemptId') attemptId: string, @Body('reason') reason: string) {
    return this.studentsService.requestAppeal(req.user.id, attemptId, reason);
  }

  @Get()
  @Permissions('USER_MANAGE')
  findAll(@Query('search') search?: string) {
    return this.studentsService.findAll(search);
  }

  @Get(':id/subjects')
  @Permissions('USER_MANAGE')
  getStudentSubjects(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.getStudentSubjects(id);
  }

  @Get(':id/exam-schedule')
  @Permissions('USER_MANAGE')
  getStudentExamSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.getStudentExamSchedule(id);
  }

  @Roles('ADMIN')
  @Permissions('USER_MANAGE')
  @Post(':id/lock')
  lock(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.studentsService.setLock(req.user, id, true);
  }

  @Roles('ADMIN')
  @Permissions('USER_MANAGE')
  @Post(':id/unlock')
  unlock(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.studentsService.setLock(req.user, id, false);
  }

  @Get(':id')
  @Permissions('USER_MANAGE')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Roles('ADMIN')
  @Permissions('USER_MANAGE')
  @Post()
  create(@Body() body: CreateStudentDto) {
    return this.studentsService.create(body);
  }

  @Roles('ADMIN')
  @Permissions('USER_MANAGE')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateStudentDto) {
    return this.studentsService.update(id, body);
  }

  @Roles('ADMIN')
  @Permissions('USER_MANAGE')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
