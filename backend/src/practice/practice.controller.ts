import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PracticeService } from './practice.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
@Controller('practice')
export class PracticeController {
  constructor(private readonly practice: PracticeService) {}

  @Post('generate')
  generate(@Request() req: any, @Body() body: { subjectId?: number; questionCount?: number; durationMinutes?: number }) {
    return this.practice.generate(req.user, body);
  }

  @Post(':sessionId/submit')
  submit(@Request() req: any, @Param('sessionId') sessionId: string, @Body() body: { answers?: Record<string, string[]> }) {
    return this.practice.submit(req.user, sessionId, body);
  }
}
