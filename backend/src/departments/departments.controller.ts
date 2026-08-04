import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDepartmentDto, UpdateDepartmentDto, AddCurriculumSubjectDto } from './dto/department.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id/curriculum')
  getCurriculum(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.getCurriculum(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() body: CreateDepartmentDto) {
    return this.departmentsService.create(body);
  }

  @Roles('ADMIN')
  @Post(':id/curriculum')
  addSubjectToCurriculum(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: AddCurriculumSubjectDto,
  ) {
    return this.departmentsService.addSubjectToCurriculum(id, body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateDepartmentDto) {
    return this.departmentsService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id/curriculum/:subjectId')
  removeSubjectFromCurriculum(
    @Param('id', ParseIntPipe) id: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
  ) {
    return this.departmentsService.removeSubjectFromCurriculum(id, subjectId);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.remove(id);
  }
}
