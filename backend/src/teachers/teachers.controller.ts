import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateTeacherDto, UpdateTeacherDto } from './dto/teacher.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Roles('TEACHER')
  @Get('my-assignments')
  getMyAssignments(@Request() req: any) {
    return this.teachersService.getMyAssignments(req.user.id);
  }

  @Roles('TEACHER')
  @Patch('my-assignments/:id/status')
  updateAssignmentStatus(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string; note?: string },
  ) {
    return this.teachersService.updateAssignmentStatus(req.user.id, id, body.status, body.note);
  }

  @Roles('TEACHER')
  @Get('my-assignments/:id/attendance-sheet')
  getAttendanceSheet(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.teachersService.getAttendanceSheet(req.user.id, id);
  }

  @Get()
  findAll() {
    return this.teachersService.findAll();
  }

  @Post(':id/lock')
  lock(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.teachersService.setLock(req.user, id, true);
  }

  @Post(':id/unlock')
  unlock(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.teachersService.setLock(req.user, id, false);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: CreateTeacherDto) {
    return this.teachersService.create(body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateTeacherDto) {
    return this.teachersService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teachersService.remove(id);
  }
}
