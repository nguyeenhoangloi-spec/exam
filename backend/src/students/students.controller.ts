import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles('STUDENT')
  @Get('my-schedule')
  getMySchedule(@Request() req: any) {
    return this.studentsService.getPersonalSchedule(req.user.id);
  }

  @Roles('STUDENT')
  @Get('my-curriculum')
  getMyCurriculum(@Request() req: any) {
    return this.studentsService.getPersonalCurriculum(req.user.id);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.studentsService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: CreateStudentDto) {
    return this.studentsService.create(body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateStudentDto) {
    return this.studentsService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
