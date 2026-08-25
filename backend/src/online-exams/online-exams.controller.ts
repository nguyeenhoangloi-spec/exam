import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Headers,
  Ip,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { OnlineExamsService } from './online-exams.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StartExamDto } from './dto/start-exam.dto';
import { SaveAnswersBatchDto } from './dto/save-answer.dto';
import { ProctoringEventsBatchDto } from './dto/proctoring-event.dto';
import { SubmitAppealDto } from './dto/appeal.dto';
import { PermissionGuard } from '../access-control/permission.guard';
import { Permissions } from '../access-control/permissions.decorator';
import { SecurityAuditEvent } from '../security-audit/security-audit-event.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
@Roles('STUDENT')
@Controller('online-exams')
export class OnlineExamsController {
  constructor(private readonly onlineExamsService: OnlineExamsService) {}

  private attemptCredential(pathValue: string, headerValue?: string) {
    if (headerValue?.trim()) return headerValue.trim();
    if (pathValue !== 'current') throw new BadRequestException('Attempt token phải được gửi qua header bảo mật.');
    throw new BadRequestException('Thiếu attempt token.');
  }

  /**
   * GET /online-exams/schedule/:scheduleId/check-eligibility
   * Kiểm tra điều kiện dự thi của sinh viên (chưa bắt đầu phiên)
   * Query params: accessCode, deviceFingerprint, webcamAvailable
   */
  @Get('schedule/:scheduleId/check-eligibility')
  @Roles('STUDENT', 'ADMIN', 'TEACHER')
  checkEligibility(
    @Request() req: any,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Ip() ip: string,
    @Query('accessCode') accessCode?: string,
    @Query('deviceFingerprint') deviceFingerprint?: string,
    @Query('webcamAvailable') webcamAvailableStr?: string,
  ) {
    const webcamAvailable =
      webcamAvailableStr === 'true' ? true : webcamAvailableStr === 'false' ? false : undefined;

    return this.onlineExamsService.checkEligibility(req.user, scheduleId, {
      clientIp: ip || '127.0.0.1',
      deviceFingerprint,
      providedAccessCode: accessCode,
      webcamAvailable,
    });
  }

  /**
   * POST /online-exams/schedule/:scheduleId/start
   * Bắt đầu phiên thi sau khi vượt qua kiểm tra điều kiện toàn diện
   */
  @Post('schedule/:scheduleId/start')
  @Permissions('ONLINE_EXAM_TAKE')
  startAttempt(
    @Request() req: any,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Body() dto: StartExamDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.onlineExamsService.startAttempt(
      req.user.id,
      scheduleId,
      dto,
      ip || '127.0.0.1',
      userAgent || 'Unknown Browser',
    );
  }

  /**
   * GET /online-exams/attempt/:token/questions
   * Lấy danh sách câu hỏi và trạng thái bài thi
   */
  @Get('attempt/:token/questions')
  @Permissions('ONLINE_EXAM_TAKE')
  getAttemptQuestions(@Request() req: any, @Param('token') token: string, @Headers('x-exam-attempt-token') attemptHeader?: string) {
    return this.onlineExamsService.getAttemptQuestions(req.user.id, this.attemptCredential(token, attemptHeader));
  }

  /**
   * POST /online-exams/attempt/:token/answers/save
   * Tự động lưu đáp án (idempotent với version)
   */
  @Post('attempt/:token/answers/save')
  @Permissions('ONLINE_EXAM_TAKE')
  saveAnswers(
    @Request() req: any,
    @Param('token') token: string,
    @Body() dto: SaveAnswersBatchDto,
    @Headers('x-exam-attempt-token') attemptHeader?: string,
  ) {
    return this.onlineExamsService.saveAnswers(req.user.id, this.attemptCredential(token, attemptHeader), dto);
  }

  /**
   * POST /online-exams/attempt/:token/heartbeat
   * Giữ kết nối và cập nhật thời gian còn lại
   */
  @Post('attempt/:token/heartbeat')
  @Permissions('ONLINE_EXAM_TAKE')
  heartbeat(@Request() req: any, @Param('token') token: string, @Headers('x-exam-attempt-token') attemptHeader?: string) {
    return this.onlineExamsService.heartbeat(req.user.id, this.attemptCredential(token, attemptHeader));
  }

  /**
   * POST /online-exams/attempt/:token/events
   * Ghi nhận sự kiện giám sát thi
   */
  @Post('attempt/:token/events')
  @Permissions('ONLINE_EXAM_TAKE')
  recordEvents(
    @Request() req: any,
    @Param('token') token: string,
    @Body() dto: ProctoringEventsBatchDto,
    @Headers('x-exam-attempt-token') attemptHeader?: string,
  ) {
    return this.onlineExamsService.recordEvents(req.user.id, this.attemptCredential(token, attemptHeader), dto);
  }

  /**
   * POST /online-exams/attempt/:token/submit
   * Nộp bài thi chủ động
   */
  @Post('attempt/:token/submit')
  @Permissions('ONLINE_EXAM_TAKE')
  submitAttempt(@Request() req: any, @Param('token') token: string, @Headers('x-exam-attempt-token') attemptHeader?: string) {
    return this.onlineExamsService.submitAttempt(req.user.id, this.attemptCredential(token, attemptHeader), false);
  }

  /**
   * GET /online-exams/attempt/:attemptId/result
   * Xem kết quả bài thi (theo cấu hình công bố)
   */
  @Get('attempt/:attemptId/result')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_RESULT_VIEWED', entityType: 'EXAM_ATTEMPT', entityIdParam: 'attemptId' })
  @Permissions('STUDENT_RESULT_VIEW')
  getAttemptResult(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
  ) {
    return this.onlineExamsService.getAttemptResult(req.user.id, attemptId);
  }

  /**
   * GET /online-exams/attempt/:attemptId/review
   * Xem toàn bộ chi tiết bài làm của sinh viên (Review câu hỏi, câu trả lời, đáp án)
   */
  @Get('attempt/:attemptId/review')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'EXAM_ATTEMPT_REVIEW_VIEWED', entityType: 'EXAM_ATTEMPT', entityIdParam: 'attemptId' })
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getAttemptReview(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
  ) {
    return this.onlineExamsService.getAttemptReviewDetails(req.user, attemptId);
  }

  /**
   * POST /online-exams/attempt/:attemptId/appeal
   * Gửi giải trình nếu bị đánh dấu vi phạm
   */
  @Post('attempt/:attemptId/appeal')
  @Permissions('ONLINE_EXAM_TAKE')
  submitAppeal(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAppealDto,
  ) {
    return this.onlineExamsService.submitAppeal(req.user.id, attemptId, dto.reason);
  }

  /**
   * GET /online-exams/schedule/:scheduleId/grade-report
   * Báo cáo tổng hợp điểm thi cho Giảng viên & Admin
   */
  @Get('schedule/:scheduleId/grade-report')
  @SecurityAuditEvent({ category: 'DATA_ACCESS', action: 'GRADE_REPORT_VIEWED', entityType: 'EXAM_SCHEDULE', entityIdParam: 'scheduleId' })
  @Roles('ADMIN', 'TEACHER')
  getGradeReport(
    @Request() req: any,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
  ) {
    return this.onlineExamsService.getGradeReport(req.user, scheduleId);
  }
}
