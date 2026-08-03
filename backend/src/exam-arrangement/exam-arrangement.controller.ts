import { Controller, Post, Get, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ExamArrangementService } from './exam-arrangement.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exam-arrangement')
export class ExamArrangementController {
  constructor(private readonly examArrangementService: ExamArrangementService) {}

  @Roles('ADMIN')
  @Post('auto-arrange')
  autoArrange(@Body() body: { examScheduleId: number; roomIds: number[] }) {
    return this.examArrangementService.autoArrange(body.examScheduleId, body.roomIds);
  }

  @Get('result')
  getResults(@Query('examScheduleId', ParseIntPipe) examScheduleId: number) {
    return this.examArrangementService.getArrangementResults(examScheduleId);
  }
}
