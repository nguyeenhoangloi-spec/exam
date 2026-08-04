import { BadRequestException, Controller, Post, Delete, Get, Body, Param, Query, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ExamSupervisorsService } from './exam-supervisors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AssignSupervisorDto, AutoSupervisorAcceptDto, AutoSupervisorPreviewDto, FindSupervisorsDto } from './dto/exam-supervisor.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('exam-supervisors')
export class ExamSupervisorsController {
  constructor(private readonly examSupervisorsService: ExamSupervisorsService) {}

  @Post('assign')
  assign(@Request() req: any, @Body() body: AssignSupervisorDto) {
    return this.examSupervisorsService.assign(req.user, body);
  }

  @Post('auto-preview')
  previewAutoAssign(@Body() body: AutoSupervisorPreviewDto) {
    return this.examSupervisorsService.previewAutoAssign(body.examScheduleId);
  }

  @Post('auto-assign')
  acceptAutoAssign(@Request() req: any, @Body() body: AutoSupervisorAcceptDto) {
    return this.examSupervisorsService.acceptAutoAssign(req.user, body.proposals);
  }

  @Get()
  find(@Query() query: FindSupervisorsDto) {
    if (!query.examScheduleRoomId && !query.examScheduleId) {
      throw new BadRequestException('Cần cung cấp examScheduleRoomId hoặc examScheduleId.');
    }
    return this.examSupervisorsService.getSupervisors(query);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.examSupervisorsService.remove(req.user, id);
  }
}
