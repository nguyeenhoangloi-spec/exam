import { Controller, Post, Delete, Get, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ExamSupervisorsService } from './exam-supervisors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exam-supervisors')
export class ExamSupervisorsController {
  constructor(private readonly examSupervisorsService: ExamSupervisorsService) {}

  @Roles('ADMIN')
  @Post('assign')
  assign(@Body() body: { examScheduleRoomId: number; teacherId: number; role?: string; note?: string }) {
    return this.examSupervisorsService.assign(body);
  }

  @Get()
  findBySchedule(@Query('examScheduleId', ParseIntPipe) examScheduleId: number) {
    return this.examSupervisorsService.getSupervisorsBySchedule(examScheduleId);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.examSupervisorsService.remove(id);
  }
}
