import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { EssayService } from './essay.service';
import { ActionReasonDto, GradeAnswerDto } from './dto/essay.dto';
import { SecurityAuditEvent } from '../security-audit/security-audit-event.decorator';

@Controller('essay-grading')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class EssayGradingController {
  constructor(private readonly essay: EssayService) {}

  @Get('assignments')
  @Roles('ADMIN', 'TEACHER')
  @Permissions('ESSAY_GRADE')
  assignments(@Request() req: any) {
    return this.essay.assignments(req.user);
  }

  @Get('attempts/:attemptId')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'ESSAY_ATTEMPT_ANSWER_VIEWED', entityType: 'EXAM_ATTEMPT', entityIdParam: 'attemptId' })
  @Roles('ADMIN', 'TEACHER')
  @Permissions('ESSAY_GRADE')
  detail(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string) {
    return this.essay.detail(req.user, id);
  }

  @Patch('answers/:answerId')
  @Roles('ADMIN', 'TEACHER')
  @Permissions('ESSAY_GRADE')
  grade(@Request() req: any, @Param('answerId', ParseUUIDPipe) id: string, @Body() dto: GradeAnswerDto) {
    return this.essay.gradeAnswer(req.user, id, dto);
  }

  @Post('answers/:answerId/ai-suggest')
  @Roles('ADMIN', 'TEACHER')
  @Permissions('ESSAY_GRADE')
  aiSuggest(@Request() req: any, @Param('answerId', ParseUUIDPipe) id: string) {
    return this.essay.aiSuggest(req.user, id);
  }

  @Post('attempts/:attemptId/submit')
  @Roles('ADMIN', 'TEACHER')
  @Permissions('ESSAY_GRADE')
  submit(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string) {
    return this.essay.submitGrading(req.user, id);
  }

  @Post('attempts/:attemptId/approve')
  @Roles('ADMIN')
  @Permissions('ESSAY_PUBLISH')
  approve(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string) {
    return this.essay.approve(req.user, id, false);
  }

  @Post('attempts/:attemptId/publish')
  @Roles('ADMIN')
  @Permissions('ESSAY_PUBLISH')
  publish(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string) {
    return this.essay.approve(req.user, id, true);
  }

  @Post('attempts/:attemptId/return')
  @Roles('ADMIN')
  @Permissions('ESSAY_PUBLISH')
  returnGrading(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string, @Body() dto: ActionReasonDto) {
    return this.essay.returnGrading(req.user, id, dto);
  }

  @Post('attempts/:attemptId/reopen')
  @Roles('ADMIN')
  @Permissions('ESSAY_PUBLISH')
  reopen(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string, @Body() dto: ActionReasonDto) {
    return this.essay.reopen(req.user, id, dto);
  }

  @Post('attempts/:attemptId/extend-time')
  @Roles('ADMIN')
  @Permissions('ESSAY_PUBLISH')
  extend(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string, @Body() dto: ActionReasonDto) {
    return this.essay.extend(req.user, id, dto);
  }

  @Post('attempts/:attemptId/penalty')
  @Roles('ADMIN')
  @Permissions('ESSAY_PUBLISH')
  penalty(@Request() req: any, @Param('attemptId', ParseUUIDPipe) id: string, @Body() dto: ActionReasonDto) {
    return this.essay.penalty(req.user, id, dto);
  }

  @Post('attempts/:attemptId/answers/:answerId/adjust')
  @Roles('ADMIN')
  @Permissions('ESSAY_PUBLISH')
  adjustScore(
    @Request() req: any,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('answerId', ParseUUIDPipe) answerId: string,
    @Body() dto: GradeAnswerDto,
  ) {
    return this.essay.adjustScorePostPublish(req.user, attemptId, answerId, dto);
  }
}
