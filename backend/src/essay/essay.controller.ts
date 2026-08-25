import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EssayService } from './essay.service';
import { ActionReasonDto, GradeAnswerDto, RubricDto } from './dto/essay.dto';
import { SecurityAuditEvent } from '../security-audit/security-audit-event.decorator';

const ESSAY_ALLOWED_MIME = /^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(jpeg|png))$/;

@Controller('essay')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EssayController {
  constructor(private readonly essay: EssayService) {}

  private attemptCredential(pathValue: string, headerValue?: string) {
    if (headerValue?.trim()) return headerValue.trim();
    throw new BadRequestException('Attempt token phải được gửi qua header bảo mật.');
  }

  @Get('questions/:questionId/rubric')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'RUBRIC_VIEWED', entityType: 'QUESTION_RUBRIC', entityIdParam: 'questionId' })
  @Roles('ADMIN', 'TEACHER')
  getRubric(@Request() req: any, @Param('questionId', ParseUUIDPipe) questionId: string) {
    return this.essay.getRubric(req.user, questionId);
  }

  @Get('questions/:questionId/rubric/versions')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'RUBRIC_VERSION_HISTORY_VIEWED', entityType: 'QUESTION_RUBRIC', entityIdParam: 'questionId' })
  @Roles('ADMIN', 'TEACHER')
  getRubricVersions(@Request() req: any, @Param('questionId', ParseUUIDPipe) questionId: string) {
    return this.essay.getRubricVersions(req.user, questionId);
  }

  @Post('questions/:questionId/rubric/ai-suggest')
  @Roles('ADMIN', 'TEACHER')
  suggestRubric(@Request() req: any, @Param('questionId', ParseUUIDPipe) questionId: string) {
    return this.essay.suggestRubric(req.user, questionId);
  }

  @Post('questions/:questionId/rubric')
  @Patch('questions/:questionId/rubric')
  @Roles('ADMIN', 'TEACHER')
  saveRubric(@Request() req: any, @Param('questionId', ParseUUIDPipe) questionId: string, @Body() dto: RubricDto) {
    return this.essay.saveRubric(req.user, questionId, dto);
  }

  @Post('grading/auto-zero-missed')
  @Roles('ADMIN', 'TEACHER')
  autoZeroMissed() {
    return this.essay.autoMarkZeroForExpiredExams();
  }

  @Get('grading/assignments')
  @Roles('ADMIN', 'TEACHER')
  assignments(@Request() req: any) {
    return this.essay.assignments(req.user);
  }

  @Get('grading/attempts/:attemptId')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'ESSAY_ATTEMPT_ANSWER_VIEWED', entityType: 'EXAM_ATTEMPT', entityIdParam: 'attemptId' })
  @Roles('ADMIN', 'TEACHER')
  detail(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.essay.detail(req.user, attemptId);
  }

  @Patch('grading/answers/:answerId')
  @Roles('ADMIN', 'TEACHER')
  gradeAnswer(@Request() req: any, @Param('answerId', ParseUUIDPipe) answerId: string, @Body() dto: GradeAnswerDto) {
    return this.essay.gradeAnswer(req.user, answerId, dto);
  }

  @Post('grading/attempts/:attemptId/submit')
  @Roles('ADMIN', 'TEACHER')
  submit(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.essay.submitGrading(req.user, attemptId);
  }

  @Post('grading/attempts/:attemptId/approve')
  @Roles('ADMIN')
  approve(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.essay.approve(req.user, attemptId, false);
  }

  @Post('grading/attempts/:attemptId/publish')
  @Roles('ADMIN')
  publish(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string) {
    return this.essay.approve(req.user, attemptId, true);
  }

  @Post('grading/attempts/:attemptId/return')
  @Roles('ADMIN')
  returnGrading(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string, @Body() dto: ActionReasonDto) {
    return this.essay.returnGrading(req.user, attemptId, dto);
  }

  @Post('grading/attempts/:attemptId/reopen')
  @Roles('ADMIN')
  reopen(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string, @Body() dto: ActionReasonDto) {
    return this.essay.reopen(req.user, attemptId, dto);
  }

  @Post('grading/attempts/:attemptId/extend-time')
  @Roles('ADMIN')
  extend(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string, @Body() dto: ActionReasonDto) {
    return this.essay.extend(req.user, attemptId, dto);
  }

  @Post('grading/attempts/:attemptId/penalty')
  @Roles('ADMIN')
  penalty(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string, @Body() dto: ActionReasonDto) {
    return this.essay.penalty(req.user, attemptId, dto);
  }

  @Post('attempt/:token/answers/:questionId/files')
  @Roles('STUDENT')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 20 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
      const accepted = ESSAY_ALLOWED_MIME.test(file.mimetype);
      callback(accepted ? null : new BadRequestException('Loại file không được hỗ trợ.'), accepted);
    },
  }))
  upload(
    @Request() req: any,
    @Param('token') token: string,
    @Headers('x-exam-attempt-token') attemptHeader: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.essay.uploadFile(req.user.id, this.attemptCredential(token, attemptHeader), questionId, file);
  }
}
