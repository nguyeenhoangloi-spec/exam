import { BadRequestException, Controller, Post, Get, Delete, Body, Param, Query, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ExamArrangementService } from './exam-arrangement.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AutoArrangeDto } from './dto/auto-arrange.dto';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('ADMIN')
@Permissions('EXAM_ARRANGEMENT_MANAGE')
@Controller('exam-arrangement')
export class ExamArrangementController {
  constructor(private readonly examArrangementService: ExamArrangementService) {}

  @Post('auto-arrange')
  autoArrange(@Request() req: any, @Body() body: AutoArrangeDto) {
    if (body.confirm !== true) throw new BadRequestException('Phải xem trước và xác nhận phương án trước khi lưu.');
    return this.examArrangementService.autoArrange(req.user, body.examScheduleId, body.roomIds);
  }

  @Post('preview')
  preview(@Request() req: any, @Body() body: AutoArrangeDto) {
    return this.examArrangementService.preview(req.user, body.examScheduleId, body.roomIds);
  }

  @Get('result')
  getResults(@Query('examScheduleId', ParseIntPipe) examScheduleId: number) {
    return this.examArrangementService.getArrangementResults(examScheduleId);
  }

  @Get('room-availability')
  getRoomAvailability(@Query('examScheduleId', ParseIntPipe) examScheduleId: number) {
    return this.examArrangementService.getRoomAvailability(examScheduleId);
  }

  @Delete('reset/:examScheduleId')
  resetArrangement(@Request() req: any, @Param('examScheduleId', ParseIntPipe) examScheduleId: number) {
    return this.examArrangementService.resetArrangement(req.user, examScheduleId);
  }

  @Get('history')
  getHistory() {
    return this.examArrangementService.getHistory();
  }
}
