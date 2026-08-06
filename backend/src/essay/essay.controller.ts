import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EssayService } from './essay.service';
import { ActionReasonDto, GradeAnswerDto, RubricDto } from './dto/essay.dto';

@Controller('essay')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EssayController {
  constructor(private readonly essay: EssayService) {}

  @Get('questions/:questionId/rubric')
  @Roles('ADMIN', 'TEACHER')
  getRubric(@Request() req: any, @Param('questionId', ParseUUIDPipe) questionId: string) { return this.essay.getRubric(req.user, questionId); }

  @Post('questions/:questionId/rubric')
  @Patch('questions/:questionId/rubric')
  @Roles('ADMIN', 'TEACHER')
  saveRubric(@Request() req: any, @Param('questionId', ParseUUIDPipe) questionId: string, @Body() dto: RubricDto) { return this.essay.saveRubric(req.user, questionId, dto); }

  @Get('grading/assignments')
  @Roles('ADMIN', 'TEACHER')
  assignments(@Request() req: any) { return this.essay.assignments(req.user); }

  @Get('grading/attempts/:attemptId')
  @Roles('ADMIN', 'TEACHER')
  detail(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string) { return this.essay.detail(req.user, attemptId); }

  @Patch('grading/answers/:answerId')
  @Roles('ADMIN', 'TEACHER')
  gradeAnswer(@Request() req: any, @Param('answerId', ParseUUIDPipe) answerId: string, @Body() dto: GradeAnswerDto) { return this.essay.gradeAnswer(req.user, answerId, dto); }

  @Post('grading/attempts/:attemptId/submit')
  @Roles('ADMIN', 'TEACHER')
  submit(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string) { return this.essay.submitGrading(req.user, attemptId); }

  @Post('grading/attempts/:attemptId/approve')
  @Roles('ADMIN')
  approve(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string) { return this.essay.approve(req.user, attemptId, false); }

  @Post('grading/attempts/:attemptId/publish')
  @Roles('ADMIN')
  publish(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string) { return this.essay.approve(req.user, attemptId, true); }

  @Post('grading/attempts/:attemptId/reopen')
  @Roles('ADMIN', 'TEACHER')
  reopen(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string, @Body() dto: ActionReasonDto) { return this.essay.reopen(req.user, attemptId, dto); }

  @Post('grading/attempts/:attemptId/extend-time')
  @Roles('ADMIN', 'TEACHER')
  extend(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string, @Body() dto: ActionReasonDto) { return this.essay.extend(req.user, attemptId, dto); }

  @Post('grading/attempts/:attemptId/penalty')
  @Roles('ADMIN')
  penalty(@Request() req: any, @Param('attemptId', ParseUUIDPipe) attemptId: string, @Body() dto: ActionReasonDto) { return this.essay.penalty(req.user, attemptId, dto); }

  @Post('attempt/:token/answers/:questionId/files')
  @Roles('STUDENT')
  @UseInterceptors(FileInterceptor('file'))
  upload(@Request() req: any, @Param('token') token: string, @Param('questionId', ParseUUIDPipe) questionId: string, @UploadedFile() file: Express.Multer.File) { return this.essay.uploadFile(req.user.id, token, questionId, file); }
}
