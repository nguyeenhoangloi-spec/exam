import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ExamSchedulesService } from './exam-schedules.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exam-schedules')
export class ExamSchedulesController {
  constructor(private readonly examSchedulesService: ExamSchedulesService) {}

  @Get()
  findAll(@Query('examPeriodId') examPeriodId?: string) {
    return this.examSchedulesService.findAll(examPeriodId ? parseInt(examPeriodId, 10) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examSchedulesService.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.examSchedulesService.create(req.user, body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.examSchedulesService.update(req.user, id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examSchedulesService.remove(req.user, id);
  }
}
