import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ExamPeriodsService } from './exam-periods.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateExamPeriodDto, UpdateExamPeriodDto } from './dto/exam-period.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('exam-periods')
export class ExamPeriodsController {
  constructor(private readonly examPeriodsService: ExamPeriodsService) {}

  @Get()
  findAll() {
    return this.examPeriodsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examPeriodsService.findOne(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Request() req: any, @Body() body: CreateExamPeriodDto) {
    return this.examPeriodsService.create(req.user, body);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateExamPeriodDto) {
    return this.examPeriodsService.update(req.user, id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examPeriodsService.remove(req.user, id);
  }

  @Roles('ADMIN')
  @Post(':id/lock')
  lock(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.examPeriodsService.lock(req.user, id, body);
  }

  @Roles('ADMIN')
  @Post(':id/unlock')
  unlock(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.examPeriodsService.unlock(req.user, id, body);
  }
}
