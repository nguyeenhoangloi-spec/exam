import { Body, Controller, Param, ParseIntPipe, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EssayService } from './essay.service';

@Controller('online-exam-config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EssayConfigController {
  constructor(private readonly essay: EssayService) {}
  @Patch(':scheduleId/essay') @Roles('ADMIN', 'TEACHER') update(@Request() req: any, @Param('scheduleId', ParseIntPipe) scheduleId: number, @Body() body: any) { return this.essay.updateConfig(req.user, scheduleId, body); }
}
