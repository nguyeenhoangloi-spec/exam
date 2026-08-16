import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProctorService } from './proctor.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
@Controller('proctor')
export class ProctorController {
  constructor(private readonly proctorService: ProctorService) {}

  @Get('live-dashboard/:scheduleRoomId')
  getLiveDashboard(
    @Request() req: any,
    @Param('scheduleRoomId', ParseIntPipe) scheduleRoomId: number,
  ) {
    return this.proctorService.getLiveDashboard(req.user.id, scheduleRoomId, req.user.role);
  }

  @Post('attempt/:attemptId/extend-time')
  extendTime(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
    @Body() body: { extraMinutes: number; reason: string },
  ) {
    return this.proctorService.extendTime(
      req.user.id,
      req.user.role,
      attemptId,
      body.extraMinutes,
      body.reason || 'Sự cố thiết bị / mạng',
    );
  }

  @Post('room/:scheduleRoomId/bulk-extend-time')
  bulkExtendTime(
    @Request() req: any,
    @Param('scheduleRoomId', ParseIntPipe) scheduleRoomId: number,
    @Body() body: { extraMinutes: number; reason: string },
  ) {
    return this.proctorService.bulkExtendTime(
      req.user.id,
      req.user.role,
      scheduleRoomId,
      body.extraMinutes,
      body.reason || 'Sự cố kỹ thuật hệ thống / mạng diện rộng',
    );
  }

  @Post('attempt/:attemptId/reopen')
  reopenAttempt(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
    @Body() body: { reason: string; penaltyPoints?: number },
  ) {
    return this.proctorService.reopenAttempt(
      req.user.id,
      req.user.role,
      attemptId,
      body.reason || 'Mở lại theo yêu cầu sinh viên',
      Number(body.penaltyPoints) || 0,
    );
  }

  @Post('attempt/:attemptId/flag-incident')
  flagIncident(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
    @Body() body: { reason: string; decision: string },
  ) {
    return this.proctorService.flagIncident(
      req.user.id,
      req.user.role,
      attemptId,
      body.reason,
      body.decision,
    );
  }

  @Post('attempt/:attemptId/resolve-incident')
  resolveIncident(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
    @Body() body: { decision: 'REOPEN' | 'PENALTY' | 'TERMINATE'; penaltyPoints?: number; note: string },
  ) {
    return this.proctorService.resolveIncident(
      req.user.id,
      req.user.role,
      attemptId,
      body.decision,
      body.penaltyPoints || 0,
      body.note || '',
    );
  }
}
