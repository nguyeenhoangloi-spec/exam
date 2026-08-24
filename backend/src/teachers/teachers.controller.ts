import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateTeacherDto, UpdateTeacherDto } from './dto/teacher.dto';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';

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

  @Roles('TEACHER')
  @Permissions('PROCTOR_ASSIGNMENT_VIEW')
  @Get('my-assignments/:id/attendance-sheet')
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
