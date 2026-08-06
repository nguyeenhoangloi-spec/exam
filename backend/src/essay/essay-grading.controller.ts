import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EssayService } from './essay.service';
import { ActionReasonDto, GradeAnswerDto } from './dto/essay.dto';

@Controller('essay-grading')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EssayGradingController {
  constructor(private readonly essay: EssayService) {}
  @Get('assignments') @Roles('ADMIN', 'TEACHER') assignments(@Request() req: any) { return this.essay.assignments(req.user); }
  @Get('attempts/:attemptId') @Roles('ADMIN', 'TEACHER') detail(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string) { return this.essay.detail(req.user, id); }
  @Patch('answers/:answerId') @Roles('ADMIN', 'TEACHER') grade(@Request() req: any, @Param('answerId', ParseUUIDPipe) id: string, @Body() dto: GradeAnswerDto) { return this.essay.gradeAnswer(req.user, id, dto); }
  @Post('answers/:answerId/ai-suggest') @Roles('ADMIN', 'TEACHER') aiSuggest(@Request() req: any, @Param('answerId', ParseUUIDPipe) id: string) { return this.essay.aiSuggest(req.user, id); }
  @Post('attempts/:attemptId/submit') @Roles('ADMIN', 'TEACHER') submit(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string) { return this.essay.submitGrading(req.user, id); }
  @Post('attempts/:attemptId/approve') @Roles('ADMIN') approve(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string) { return this.essay.approve(req.user, id, false); }
  @Post('attempts/:attemptId/publish') @Roles('ADMIN') publish(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string) { return this.essay.approve(req.user, id, true); }
  @Post('attempts/:attemptId/reopen') @Roles('ADMIN') reopen(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string, @Body() dto: ActionReasonDto) { return this.essay.reopen(req.user, id, dto); }
  @Post('attempts/:attemptId/extend-time') @Roles('ADMIN') extend(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string, @Body() dto: ActionReasonDto) { return this.essay.extend(req.user, id, dto); }
  @Post('attempts/:attemptId/penalty') @Roles('ADMIN') penalty(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string, @Body() dto: ActionReasonDto) { return this.essay.penalty(req.user, id, dto); }
}
