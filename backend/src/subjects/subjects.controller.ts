import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findOne(id);
  }

  @Get(':id/chapters')
  findChapters(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findChapters(id);
  }

  @Get(':id/enrollments')
  getEnrollments(@Param('id', ParseIntPipe) id: number, @Query('semester') semester?: string, @Query('schoolYear') schoolYear?: string) {
    return this.subjectsService.getEnrollments(id, semester, schoolYear);
  }

  @Post(':id/enroll-students')
  enrollStudents(@Param('id', ParseIntPipe) id: number, @Body() body: { studentIds: number[]; semester: string; schoolYear: string }) {
    return this.subjectsService.enrollStudents(id, body);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: CreateSubjectDto) {
    return this.subjectsService.create(body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateSubjectDto) {
    return this.subjectsService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.remove(id);
  }
}
