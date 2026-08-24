import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ExamPeriodsService } from './exam-periods.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateExamPeriodDto, UpdateExamPeriodDto } from './dto/exam-period.dto';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
@Controller('exam-periods')
export class ExamPeriodsController {
  constructor(private readonly examPeriodsService: ExamPeriodsService) {}

  @Get()
  @Roles('ADMIN', 'TEACHER')
  findAll() {
    return this.examPeriodsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'TEACHER')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examPeriodsService.findOne(id);
  }

  @Roles('ADMIN')
  @Permissions('EXAM_PERIOD_MANAGE')
  @Post()
  create(@Request() req: any, @Body() body: CreateExamPeriodDto) {
    return this.examPeriodsService.create(req.user, body);
  }

  @Roles('ADMIN')
  @Permissions('EXAM_PERIOD_MANAGE')
  @Patch(':id')
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateExamPeriodDto) {
    return this.examPeriodsService.update(req.user, id, body);
  }

  @Roles('ADMIN')
  @Permissions('EXAM_PERIOD_MANAGE')
  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examPeriodsService.remove(req.user, id);
  }

  @Roles('ADMIN')
  @Permissions('EXAM_PERIOD_MANAGE')
  @Post(':id/lock')
  lock(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.examPeriodsService.lock(req.user, id, body);
  }

  @Roles('ADMIN')
  @Permissions('EXAM_PERIOD_MANAGE')
  @Post(':id/unlock')
  unlock(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.examPeriodsService.unlock(req.user, id, body);
  }
}
