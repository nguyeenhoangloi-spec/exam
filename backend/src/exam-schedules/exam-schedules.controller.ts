import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ExamSchedulesService } from './exam-schedules.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateExamScheduleDto, FindExamSchedulesDto, UpdateExamScheduleDto } from './dto/exam-schedule.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('exam-schedules')
export class ExamSchedulesController {
  constructor(private readonly examSchedulesService: ExamSchedulesService) {}

  @Get()
  @Roles('ADMIN', 'TEACHER')
  findAll(@Request() req: any, @Query() query: FindExamSchedulesDto) {
    return this.examSchedulesService.findAll(req.user, query.examPeriodId);
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examSchedulesService.findOne(req.user, id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Request() req: any, @Body() body: CreateExamScheduleDto) {
    return this.examSchedulesService.create(req.user, body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateExamScheduleDto) {
    return this.examSchedulesService.update(req.user, id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examSchedulesService.remove(req.user, id);
  }
}
