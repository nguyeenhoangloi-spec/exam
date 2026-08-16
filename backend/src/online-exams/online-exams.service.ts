import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartExamDto } from './dto/start-exam.dto';
import { SaveAnswersBatchDto } from './dto/save-answer.dto';
import { ProctoringEventsBatchDto } from './dto/proctoring-event.dto';
import { AttemptStatus, EventSeverity } from '@prisma/client';
import * as crypto from 'crypto';
import {
  EligibilityCheckerService,
  EligibilityErrorCode,
  EligibilityInput,
} from './eligibility-checker.service';
import { EssayService } from '../essay/essay.service';
import { UpdateMediaDisplayConfigDto } from './dto/media-display-config.dto';
import { AuditService } from '../audit/audit.service';
import { OnlineExamCore } from './online-exam.core';
import { OnlineExamGradingCore } from './online-exam-grading.core';
import { OnlineExamProctoringCore } from './online-exam-proctoring.core';
import { OnlineExamAnswerCore } from './online-exam-answer.core';

@Injectable()
export class OnlineExamsService {
  private readonly logger = new Logger(OnlineExamsService.name);
  private readonly examCore = new OnlineExamCore();
  private readonly gradingCore = new OnlineExamGradingCore();
  private readonly proctoringCore = new OnlineExamProctoringCore();
  private readonly answerCore = new OnlineExamAnswerCore();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityChecker: EligibilityCheckerService,
    private readonly essayService: EssayService,
    private readonly audit: AuditService,
  ) { }

  private async assertTeacherScheduleAccess(actor: any, scheduleId: number) {
    if (actor?.role !== 'TEACHER') {
      return;
    }

    const assignment = await this.prisma.examScheduleRoom.findFirst({
      where: {
        examScheduleId: scheduleId,
        supervisors: { some: { teacher: { userId: actor.id } } },
      },
      select: { id: true },
    });

    if (!assignment) {
      throw new ForbiddenException('Bạn không được phân công giám thị lịch thi này.');
    }
  }

  /**
   * Cập nhật cấu hình hiển thị media (Ảnh / Video / Âm thanh) của một ca thi.
   * Chỉ ADMIN hoặc Giảng viên được phân công coi thi lịch đó mới được thao tác.
   */
  async updateMediaDisplayConfig(actor: any, scheduleId: number, dto: UpdateMediaDisplayConfigDto) {
    if (actor.role !== 'ADMIN') {
      const isSupervisor = await this.prisma.examScheduleRoom.findFirst({
        where: {
          examScheduleId: scheduleId,
          supervisors: { some: { teacher: { userId: actor.id } } },
        },
        select: { id: true },
      });
      if (!isSupervisor) {
        throw new ForbiddenException('Bạn không được cấu hình hiển thị media cho lịch thi này.');
      }
    }

    let config = await this.prisma.onlineExamConfig.findUnique({ where: { examScheduleId: scheduleId } });

    if (!config) {
      // Nếu chưa có config, tạo mới với đề PUBLISHED gần nhất (đồng hành với startAttempt)
      const publishedPaper = await this.prisma.examPaper.findFirst({
        where: { examScheduleId: scheduleId, status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
      });
      if (!publishedPaper) {
        throw new BadRequestException('Lịch thi chưa có đề thi chính thức được phát hành.');
      }
      config = await this.prisma.onlineExamConfig.create({
        data: {
          examScheduleId: scheduleId,
          examPaperId: publishedPaper.id,
        },
      });
    }

    const updated = await this.prisma.onlineExamConfig.update({
      where: { examScheduleId: scheduleId },
      data: {
        ...(dto.showImages !== undefined ? { showImages: Boolean(dto.showImages) } : {}),
        ...(dto.showVideos !== undefined ? { showVideos: Boolean(dto.showVideos) } : {}),
        ...(dto.showAudios !== undefined ? { showAudios: Boolean(dto.showAudios) } : {}),
      },
    });

    await this.audit.write({
      actorId: actor.id,
      action: 'UPDATE',
      entityType: 'ONLINE_EXAM_CONFIG',
      entityId: scheduleId,
      description: 'Cập nhật cấu hình hiển thị media của ca thi',
      metadata: dto as any,
    });

    return updated;
  }

  /**
   * Kiểm tra điều kiện dự thi của sinh viên (endpoint GET – chưa bắt đầu phiên)
   */
  async checkEligibility(
    studentUserId: number,
    scheduleId: number,
    input?: Partial<EligibilityInput>,
  ) {
    const result = await this.eligibilityChecker.check({
      studentUserId,
      scheduleId,
      ...input,
    });

    if (!result.isEligible) {
      return {
        isEligible: false,
        errorCode: result.errorCode,
        reason: result.reason,
        existingAttempt: result.data?.existingAttempt,
        examInfo: result.data?.schedule
          ? {
            subjectName: result.data.schedule.subject?.subjectName,
            subjectCode: result.data.schedule.subject?.subjectCode,
            examPeriodName: result.data.schedule.examPeriod?.name,
            examDate: result.data.schedule.examDate,
            startTime: result.data.schedule.startTime,
            endTime: result.data.schedule.endTime,
            durationMinutes: (result.data as any)?.config?.examPaper?.durationMinutes || 60,
            examPasswordRequired: result.errorCode === 'EXAM_PASSWORD_REQUIRED' || !!(result.data as any)?.config?.examPasswordHash,
            accessCodeRequired: result.errorCode === 'ACCESS_CODE_REQUIRED' || !!(result.data as any)?.config?.accessCode,
          }
          : undefined,
        student: result.data?.student
          ? {
            id: result.data.student.id,
            studentCode: result.data.student.studentCode,
            fullName: result.data.student.fullName,
            examNumber: result.data.roomStudentInfo?.examNumber,
            seatNumber: result.data.roomStudentInfo?.seatNumber,
            roomCode: result.data.roomStudentInfo?.roomCode,
            roomName: result.data.roomStudentInfo?.roomName,
            building: result.data.roomStudentInfo?.building,
          }
          : undefined,
      };
    }

    const d = result.data!;
    return {
      isEligible: true,
      reason: 'Sinh viên đủ điều kiện tham gia thi',
      examInfo: {
        subjectName: d.schedule?.subject?.subjectName,
        subjectCode: d.schedule?.subject?.subjectCode,
        examPeriodName: d.schedule?.examPeriod?.name,
        examDate: d.schedule?.examDate,
        startTime: d.schedule?.startTime,
        endTime: d.schedule?.endTime,
        durationMinutes: d.config?.examPaper?.durationMinutes,
        requireWebcam: d.config?.requireWebcam,
        requireFullscreen: d.config?.requireFullscreen,
        requireRulesAcceptance: d.config?.requireRulesAcceptance,
        accessCodeRequired: !!d.config?.accessCode,
        examPasswordRequired: !!d.config?.examPasswordHash,
        serverTime: d.serverTime,
        remainingEntrySeconds: d.remainingEntrySeconds,
      },
      existingAttempt: d.existingAttempt,
      student: {
        id: d.student?.id,
        studentCode: (d.student as any)?.studentCode,
        fullName: d.student?.fullName,
        examNumber: d.roomStudentInfo?.examNumber,
        seatNumber: d.roomStudentInfo?.seatNumber,
        roomCode: d.roomStudentInfo?.roomCode,
        roomName: d.roomStudentInfo?.roomName,
        building: d.roomStudentInfo?.building,
      },
    };
  }

  /**
   * Bắt đầu phiên thi (Tạo Attempt, Snapshot, Token)
   * – Chạy kiểm tra điều kiện toàn diện trước khi tạo bất kỳ dữ liệu nào
   */
  async startAttempt(
    studentUserId: number,
    scheduleId: number,
    dto: StartExamDto,
    clientIp: string,
    userAgent: string,
  ) {
    // Chạy kiểm tra điều kiện toàn diện với đầy đủ input bảo mật
    const eligResult = await this.eligibilityChecker.check({
      studentUserId,
      scheduleId,
      clientIp,
      deviceFingerprint: dto.deviceFingerprint,
      providedAccessCode: dto.accessCode,
      providedExamPassword: dto.examPassword,
      webcamAvailable: dto.webcamAvailable,
      deviceCheckPassed: dto.deviceCheckPassed,
    });

    if (!eligResult.isEligible) {
      throw new ForbiddenException({
        errorCode: eligResult.errorCode,
        message: eligResult.reason,
      });
    }

    const eligData = eligResult.data!;
    const student = eligData.student;
    const schedule = eligData.schedule;
    let config = eligData.config;

    // Xử lý phiên thi đang hoạt động (khôi phục sau mất kết nối)
    if (eligData.existingAttempt) {
      const activeStatuses = ['IN_PROGRESS', 'DISCONNECTED', 'DEVICE_CHECK', 'READY'];
      if (activeStatuses.includes(eligData.existingAttempt.status)) {
        return {
          attemptId: eligData.existingAttempt.id,
          attemptToken: eligData.existingAttempt.attemptToken,
          status: eligData.existingAttempt.status,
          startTime: eligData.existingAttempt.startTime,
          expectedEndTime: eligData.existingAttempt.expectedEndTime,
          durationMinutes: config?.examPaper?.durationMinutes,
          resumed: true,
        };
      }
    }

    // Kiểm tra sinh viên đã chấp nhận quy định thi
    if (config?.requireRulesAcceptance && !dto.rulesAccepted) {
      throw new ForbiddenException({
        errorCode: 'RULES_NOT_ACCEPTED',
        message: 'Bạn phải đọc và chấp nhận quy định thi trước khi bắt đầu',
      });
    }

    // Nếu chưa có OnlineExamConfig, tự động tạo với ExamPaper PUBLISHED
    if (!config) {
      const publishedPaper = await this.prisma.examPaper.findFirst({
        where: { examScheduleId: scheduleId, status: 'PUBLISHED' },
      });
      if (!publishedPaper) {
        throw new BadRequestException('Kỳ thi chưa có đề thi chính thức được phát hành.');
      }
      config = await this.prisma.onlineExamConfig.create({
        data: {
          examScheduleId: scheduleId,
          examPaperId: publishedPaper.id,
          requireFullscreen: true,
          preventTabSwitch: true,
          preventCopyPaste: true,
          shuffleQuestions: true,
          shuffleOptions: true,
        },
        include: { examPaper: true },
      });
    }

    // Tải thông tin chi tiết đề thi tiêu chuẩn
    const paper = await this.prisma.examPaper.findUnique({
      where: { id: config.examPaperId },
      include: {
        questions: {
          include: {
            question: {
              include: {
                options: { include: { media: true } },
                media: true,
                fillBlankAnswers: { orderBy: { blankIndex: 'asc' } },
              },
            },
          },
          orderBy: {
            questionOrder: 'asc',
          },
        },
      },
    });

    if (!paper || !paper.questions || paper.questions.length === 0) {
      throw new BadRequestException('Đề thi không có câu hỏi nào');
    }

    // Xáo trộn câu hỏi & phương án cho từng sinh viên
    const snapshotData = this.examCore.buildSnapshot(paper.questions, {
      shuffleQuestions: config.shuffleQuestions,
      shuffleOptions: config.shuffleOptions,
    });

    const now = new Date();
    let expectedEndTime = new Date(now.getTime() + paper.durationMinutes * 60 * 1000);

    // QUY TẮC NGHIỆP VỤ KHẢO THÍ:
    // Sinh viên vào muộn thì thời gian làm bài bị trừ tương ứng, tính từ giờ bắt đầu chính thức của ca thi.
    if (schedule && schedule.mode === 'OFFICIAL' && schedule.examDate && schedule.startTime) {
      const examStartTime = this.eligibilityChecker.buildExamDateTime(schedule.examDate, schedule.startTime);
      const scheduleEndTime = schedule.endTime
        ? this.eligibilityChecker.buildExamDateTime(schedule.examDate, schedule.endTime)
        : new Date(examStartTime.getTime() + paper.durationMinutes * 60 * 1000);

      const officialDeadline = new Date(
        Math.min(
          scheduleEndTime.getTime(),
          examStartTime.getTime() + paper.durationMinutes * 60 * 1000,
        ),
      );

      // Nếu sinh viên vào muộn sau giờ bắt đầu ca thi, thời gian kết thúc cố định theo hạn chót ca thi
      if (now > examStartTime) {
        expectedEndTime = officialDeadline;
      } else {
        // Nếu sinh viên vào đúng giờ hoặc sớm hơn, hạn chót không được vượt quá deadline của ca thi
        expectedEndTime = new Date(Math.min(expectedEndTime.getTime(), officialDeadline.getTime()));
      }

      if (expectedEndTime.getTime() <= now.getTime()) {
        throw new BadRequestException('Ca thi đã kết thúc thời gian làm bài.');
      }
    }

    const attemptToken = crypto.randomUUID();

    // Tạo Attempt và ExamSnapshot trong DB Transaction
    const createdAttempt = await this.prisma.$transaction(async (tx) => {
      const newAttempt = await tx.examAttempt.create({
        data: {
          onlineExamConfigId: config.id,
          studentId: student.id,
          attemptToken,
          status: AttemptStatus.IN_PROGRESS,
          startTime: now,
          expectedEndTime,
          clientIp,
          userAgent,
          deviceFingerprint: dto.deviceFingerprint || null,
          maxScore: paper.totalScore,
        },
      });

      await tx.examSnapshot.create({
        data: {
          attemptId: newAttempt.id,
          paperTitle: paper.title,
          duration: paper.durationMinutes,
          questionCount: snapshotData.length,
          snapshotData: snapshotData as any,
        },
      });

      // Tạo DeviceSession
      await tx.deviceSession.create({
        data: {
          attemptId: newAttempt.id,
          sessionToken: attemptToken,
          deviceInfo: userAgent,
          ipAddress: clientIp,
          isActive: true,
        },
      });

      return newAttempt;
    });

    return {
      attemptId: createdAttempt.id,
      attemptToken: createdAttempt.attemptToken,
      status: createdAttempt.status,
      startTime: createdAttempt.startTime,
      expectedEndTime: createdAttempt.expectedEndTime,
      durationMinutes: paper.durationMinutes,
    };
  }

  /**
   * Lấy danh sách câu hỏi đề thi (Bảo mật: Đã lọc bỏ `isCorrect`)
   */
  async getAttemptQuestions(studentUserId: number, attemptToken: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { attemptToken },
      include: {
        student: true,
        snapshot: true,
        attemptAnswers: { include: { submissionFiles: true } },
        onlineExamConfig: true,
      },
    });

    if (!attempt || attempt.student.userId !== studentUserId) {
      throw new ForbiddenException('Phiên thi không hợp lệ hoặc không thuộc về sinh viên này');
    }

    const now = new Date();
    const isExpired = attempt.expectedEndTime && now.getTime() > attempt.expectedEndTime.getTime() + 10000;

    if (isExpired && attempt.status === AttemptStatus.IN_PROGRESS) {
      await this.submitAttempt(studentUserId, attemptToken, true);
      throw new BadRequestException('Bài thi đã hết giờ và được tự động nộp');
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor(((attempt.expectedEndTime?.getTime() || Date.now()) - now.getTime()) / 1000),
    );

    const rawQuestions: any[] = (attempt.snapshot?.snapshotData as any[]) || [];

    const cfg = attempt.onlineExamConfig;
    const mediaFlags = {
      showImages: cfg.showImages !== false,
      showVideos: cfg.showVideos !== false,
      showAudios: cfg.showAudios !== false,
    };

    // BỌC AN TOÀN BẢO MẬT: Lọc sạch thuộc tính isCorrect trước khi gửi cho Client!
    const clientQuestions = this.examCore.sanitizeQuestions(rawQuestions, mediaFlags);

    return {
      attemptId: attempt.id,
      status: attempt.status,
      paperTitle: attempt.snapshot?.paperTitle || 'Bài thi trắc nghiệm',
      durationMinutes: attempt.snapshot?.duration || 60,
      remainingSeconds,
      startTime: attempt.startTime,
      expectedEndTime: attempt.expectedEndTime,
      violationCount: await this.prisma.proctoringEvent.count({ where: { attemptId: attempt.id } }),
      config: {
        requireFullscreen: attempt.onlineExamConfig.requireFullscreen,
        preventTabSwitch: attempt.onlineExamConfig.preventTabSwitch,
        preventCopyPaste: attempt.onlineExamConfig.preventCopyPaste,
        maxAllowedViolations: attempt.onlineExamConfig.maxAllowedViolations || 5,
        essayEnabled: attempt.onlineExamConfig.essayEnabled,
        allowEssayFileUpload: attempt.onlineExamConfig.allowEssayFileUpload,
        maxEssayFileSizeMb: attempt.onlineExamConfig.maxEssayFileSizeMb,
      },
      savedAnswers: attempt.attemptAnswers.map((ans) => ({
        questionId: ans.questionId,
        selectedOptionIds: ans.selectedOptionIds,
        textAnswer: ans.textAnswer,
        isFlaggedForReview: ans.isFlaggedForReview,
        version: ans.version,
        textAnswerRich: ans.textAnswerRich,
        fillBlankAnswers: ans.fillBlankAnswers,
        fillBlankScore: ans.fillBlankScore,
        lastSavedAt: ans.serverTimestamp,
        files: ans.submissionFiles,
      })),
      questions: clientQuestions,
    };
  }

  /**
   * Tự động lưu đáp án (Idempotent: Kiểm tra Version)
   */
  async saveAnswers(studentUserId: number, attemptToken: string, dto: SaveAnswersBatchDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { attemptToken },
      include: { student: true, snapshot: true },
    });

    if (!attempt || attempt.student.userId !== studentUserId) {
      throw new ForbiddenException('Phiên thi không hợp lệ');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS && attempt.status !== AttemptStatus.DISCONNECTED) {
      throw new BadRequestException('Không thể lưu đáp án do bài thi đã nộp hoặc kết thúc');
    }

    const now = new Date();
    if (attempt.expectedEndTime && now.getTime() > attempt.expectedEndTime.getTime() + 15000) {
      await this.submitAttempt(studentUserId, attemptToken, true);
      throw new BadRequestException('Đã hết thời gian thi');
    }

    let savedCount = 0;
    const snapshotQuestions: any[] = (attempt.snapshot?.snapshotData as any[]) || [];
    for (const item of dto.answers) {
      const snapshotQuestion = snapshotQuestions.find((question) => question.questionId === item.questionId);
      try {
        this.answerCore.validate(snapshotQuestion, item);
      } catch (error: any) {
        const messages: Record<string, string> = {
          QUESTION_NOT_IN_SNAPSHOT: 'Câu hỏi không thuộc đề thi này.',
          FILL_BLANK_DATA_NOT_ALLOWED: 'Chỉ câu điền khuyết mới nhận dữ liệu ô trống.',
          INVALID_FILL_BLANK_DATA: 'Dữ liệu chỗ trống không hợp lệ.',
        };
        throw new BadRequestException(messages[error?.message] || 'Dữ liệu đáp án không hợp lệ.');
      }
      const existing = await this.prisma.attemptAnswer.findUnique({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: item.questionId,
          },
        },
      });

      // Nếu bản ghi trên DB có version lớn hơn version incoming, bỏ qua để tránh ghi đè dữ liệu cũ!
      if (existing && existing.version >= item.version) {
        continue;
      }

      await this.prisma.attemptAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: item.questionId,
          },
        },
        create: {
          attemptId: attempt.id,
          questionId: item.questionId,
          selectedOptionIds: item.selectedOptionIds ? (item.selectedOptionIds as any) : null,
          textAnswer: item.textAnswer || null,
          textAnswerRich: item.textAnswerRich ? (item.textAnswerRich as any) : null,
          fillBlankAnswers: item.fillBlankAnswers ? (item.fillBlankAnswers as any) : null,
          isFlaggedForReview: item.isFlaggedForReview || false,
          version: item.version,
          clientTimestamp: new Date(item.clientTimestamp),
          lastSavedAt: now,
        },
        update: {
          selectedOptionIds: item.selectedOptionIds ? (item.selectedOptionIds as any) : null,
          textAnswer: item.textAnswer || null,
          textAnswerRich: item.textAnswerRich ? (item.textAnswerRich as any) : null,
          fillBlankAnswers: item.fillBlankAnswers ? (item.fillBlankAnswers as any) : null,
          isFlaggedForReview: item.isFlaggedForReview || false,
          version: item.version,
          clientTimestamp: new Date(item.clientTimestamp),
          serverTimestamp: now,
          lastSavedAt: now,
        },
      });
      savedCount++;
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor(((attempt.expectedEndTime?.getTime() || Date.now()) - now.getTime()) / 1000),
    );

    return {
      success: true,
      savedCount,
      remainingSeconds,
    };
  }

  /**
   * Heartbeat giữ kết nối & cập nhật đếm ngược
   */
  async heartbeat(studentUserId: number, attemptToken: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { attemptToken },
      include: { student: true },
    });

    if (!attempt || attempt.student.userId !== studentUserId) {
      throw new ForbiddenException('Phiên thi không hợp lệ');
    }

    const now = new Date();
    const remainingSeconds = Math.max(
      0,
      Math.floor(((attempt.expectedEndTime?.getTime() || Date.now()) - now.getTime()) / 1000),
    );

    if (remainingSeconds === 0 && attempt.status === AttemptStatus.IN_PROGRESS) {
      await this.submitAttempt(studentUserId, attemptToken, true);
      return {
        status: AttemptStatus.AUTO_SUBMITTED,
        remainingSeconds: 0,
        message: 'Bài thi đã tự động nộp do hết giờ',
      };
    }

    // Cập nhật DeviceSession lastSeenAt
    await this.prisma.deviceSession.updateMany({
      where: { attemptId: attempt.id, sessionToken: attemptToken },
      data: { lastSeenAt: now, isActive: true },
    });

    return {
      status: attempt.status,
      remainingSeconds,
      isFlagged: attempt.isFlagged,
      riskScore: attempt.riskScore,
    };
  }

  /**
   * Ghi nhận danh sách sự kiện giám sát & Tính Risk Score
   */
  async recordEvents(studentUserId: number, attemptToken: string, dto: ProctoringEventsBatchDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { attemptToken },
      include: { student: true, onlineExamConfig: { include: { securityPolicy: true } } },
    });

    if (!attempt || attempt.student.userId !== studentUserId) {
      throw new ForbiddenException('Phiên thi không hợp lệ');
    }

    if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED', 'INVALIDATED', 'TERMINATED'].includes(attempt.status)) {
      const violationLimit = Math.max(1, attempt.onlineExamConfig?.maxAllowedViolations || 5);
      const recordedEvents = await this.prisma.proctoringEvent.count({ where: { attemptId: attempt.id } });
      return {
        success: false,
        currentRiskScore: attempt.riskScore,
        isFlagged: attempt.isFlagged,
        autoSubmitted: true,
        isTerminated: attempt.status === 'TERMINATED',
        violationCount: recordedEvents || violationLimit,
        maxAllowedViolations: violationLimit,
        status: attempt.status,
      };
    }

    const policy = attempt.onlineExamConfig.securityPolicy;
    for (const evt of dto.events) {
      await this.prisma.proctoringEvent.create({
        data: {
          attemptId: attempt.id,
          eventType: evt.eventType,
          severity: evt.severity || EventSeverity.LOW,
          duration: evt.duration || null,
          metadata: evt.metadata || null,
          evidenceUrl: evt.evidenceUrl || null,
        },
      });
    }

    const addedRisk = this.proctoringCore.calculateRisk(dto.events, policy);
    const { newRiskScore, shouldFlag } = this.proctoringCore.shouldFlag(attempt.riskScore, addedRisk, policy);

    await this.prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        riskScore: newRiskScore,
        isFlagged: shouldFlag ? true : attempt.isFlagged,
      },
    });

    const violationLimit = Math.max(1, attempt.onlineExamConfig.maxAllowedViolations || 5);
    const recordedEvents = await this.prisma.proctoringEvent.count({ where: { attemptId: attempt.id } });
    if (recordedEvents >= violationLimit) {
      await this.prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'TERMINATED',
          isFlagged: true,
          totalScore: 0,
          submittedAt: new Date(),
          gradingStatus: 'NOT_SUBMITTED',
        },
      });

      await this.prisma.examIncident.create({
        data: {
          attemptId: attempt.id,
          reportedById: 0,
          reason: `Tự động đình chỉ và nộp bài (0 điểm) do vi phạm quy chế vượt quá ${violationLimit} lần cảnh báo.`,
          decision: 'TERMINATED',
        },
      });

      return {
        success: true,
        currentRiskScore: newRiskScore,
        isFlagged: true,
        autoSubmitted: true,
        isTerminated: true,
        violationCount: recordedEvents,
        recordedEvents,
        maxAllowedViolations: violationLimit,
        violationLimit,
        status: 'TERMINATED',
      };
    }

    return {
      success: true,
      currentRiskScore: newRiskScore,
      isFlagged: shouldFlag,
      autoSubmitted: false,
      violationCount: recordedEvents,
      recordedEvents,
      maxAllowedViolations: violationLimit,
      violationLimit,
    };
  }

  /**
   * Nộp bài thi (Thủ công hoặc Hết giờ tự động)
   */
  async submitAttempt(studentUserId: number, attemptToken: string, isAutoSubmit = false) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { attemptToken },
      include: {
        student: true,
        snapshot: true,
        attemptAnswers: true,
        onlineExamConfig: true,
      },
    });

    if (!attempt || attempt.student.userId !== studentUserId) {
      throw new ForbiddenException('Phiên thi không hợp lệ');
    }

    if (['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED', 'INVALIDATED'].includes(attempt.status)) {
      const essayPending = attempt.gradingStatus === 'SUBMITTED' || attempt.gradingStatus === 'UNDER_GRADING' || attempt.gradingStatus === 'WAITING_APPROVAL';
      return {
        message: 'Bài thi đã được nộp từ trước',
        status: attempt.status,
        totalScore: attempt.totalScore ?? 0,
        maxScore: attempt.maxScore ?? 10,
        showResultImmediately: !essayPending || attempt.gradingStatus === 'PUBLISHED',
      };
    }

    // Tính điểm tự động dựa trên Snapshot & AttemptAnswers
    const snapshotQuestions: any[] = (attempt.snapshot?.snapshotData as any[]) || [];
    const gradingResult = this.gradingCore.grade(snapshotQuestions, attempt.attemptAnswers, attempt.penaltyPoints || 0);
    const { hasEssay, calculatedScore, fillBlankUpdates } = gradingResult;

    const finalStatus = attempt.isFlagged
      ? AttemptStatus.UNDER_REVIEW
      : isAutoSubmit
        ? AttemptStatus.AUTO_SUBMITTED
        : AttemptStatus.SUBMITTED;

    const updated = await this.prisma.$transaction(async tx => {
      for (const item of fillBlankUpdates) {
        await tx.attemptAnswer.updateMany({ where: { attemptId: attempt.id, questionId: item.questionId }, data: { fillBlankScore: item.score, fillBlankResult: item.result as any, finalScore: item.score } });
      }
      return tx.examAttempt.update({
        where: { id: attempt.id },
        data: {
          status: finalStatus,
          submittedAt: new Date(),
          totalScore: hasEssay ? null : calculatedScore,
          gradingStatus: hasEssay ? 'SUBMITTED' : 'NOT_SUBMITTED',
        },
      });
    });
    // 🤖 Tự động kích hoạt AI chấm bài ngay lập tức khi sinh viên nộp bài thi tự luận
    if (hasEssay) {
      try {
        await this.essayService.autoGradeAttempt(updated.id);
      } catch (err: any) {
        this.logger.error(`[AutoGrade] AI chấm bài thi ${updated.id} gặp lỗi: ${err?.message || err}`);
      }
    }

    return {
      success: true,
      message: isAutoSubmit ? 'Bài thi đã tự động nộp do hết giờ' : 'Nộp bài thi thành công',
      status: updated.status,
      submittedAt: updated.submittedAt,
      totalScore: hasEssay ? null : calculatedScore,
      maxScore: attempt.maxScore ?? 10,
      showResultImmediately: !hasEssay,
    };
  }

  /**
   * Xem kết quả bài thi sau khi nộp
   */
  async getAttemptResult(studentUserId: number, attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: true,
        onlineExamConfig: {
          include: {
            examSchedule: true,
          },
        },
        incidents: true,
        attemptAnswers: {
          include: { essayGrades: { include: { criterion: true } } },
        },
      },
    });

    if (!attempt || attempt.student.userId !== studentUserId) {
      throw new ForbiddenException('Không có quyền xem kết quả phiên thi này');
    }

    const config = attempt.onlineExamConfig;
    const schedule = config?.examSchedule;
    const now = new Date();

    let isExamEnded = false;
    let examEndTimeStr = '';

    if (schedule) {
      const [hours, minutes] = (schedule.endTime || '23:59').split(':').map(Number);
      const dt = new Date(schedule.examDate);
      dt.setHours(hours, minutes, 0, 0);
      isExamEnded = now >= dt;
      examEndTimeStr = `${schedule.endTime} ngày ${new Date(schedule.examDate).toLocaleDateString('vi-VN')}`;
    } else {
      isExamEnded = true;
    }

    const hasEssay = attempt.gradingStatus !== 'NOT_SUBMITTED';
    const canShowScore = hasEssay
      ? attempt.gradingStatus === 'PUBLISHED'
      : Boolean(config?.showResultImmediately) || isExamEnded || attempt.status === 'GRADED';

    // Student score visibility and answer-review visibility are separate policies.
    // A score may be visible while the answer key is still withheld.
    const canStudentReview = Boolean(config?.allowReview)
      && canShowScore
      && (
        Boolean(config?.showResultImmediately)
        || Boolean(attempt.publishedAt)
        || attempt.gradingStatus === 'PUBLISHED'
      );

    return {
      attemptId: attempt.id,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      totalScore: canShowScore ? (attempt.totalScore ?? 0) : null,
      maxScore: attempt.maxScore ?? 10,
      showResultImmediately: canShowScore,
      allowReview: canStudentReview,
      gradingStatus: attempt.gradingStatus,
      isExamEnded,
      examEndTime: examEndTimeStr,
      isFlagged: attempt.isFlagged,
      incidents: attempt.incidents,
      essayAnswers: canShowScore && hasEssay
        ? attempt.attemptAnswers.map((answer: any) => ({
          questionId: answer.questionId,
          finalScore: answer.finalScore,
          teacherComment: answer.teacherComment,
          criteria: answer.essayGrades.map((grade: any) => ({ label: grade.criterion.label, score: grade.score, maxScore: grade.criterion.maxScore, comment: grade.comment })),
        }))
        : [],
    };
  }

  /**
   * Xem toàn bộ bài làm chi tiết của sinh viên (Review Attempt Details)
   */
  async getAttemptReviewDetails(user: any, attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: true,
        snapshot: true,
        attemptAnswers: {
          include: { essayGrades: { include: { criterion: true } } },
        },
        incidents: true,
        proctoringEvents: { orderBy: { occurredAt: 'desc' } },
        onlineExamConfig: {
          include: {
            examSchedule: {
              include: {
                subject: true,
              },
            },
            examPaper: true,
          },
        },
      },
    }) as any;

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy phiên làm bài thi');
    }

    const isAdminOrTeacher = ['ADMIN', 'TEACHER'].includes(user?.role);
    if (!isAdminOrTeacher && attempt.student.userId !== user?.id) {
      throw new ForbiddenException('Bạn không có quyền xem bài làm của thí sinh này');
    }

    await this.assertTeacherScheduleAccess(user, attempt.onlineExamConfig.examScheduleId);

    // Never expose the answer key to students before the review is explicitly
    // released. This is enforced server-side; hiding a UI button is not enough.
    const config = attempt.onlineExamConfig;
    const hasEssay = attempt.gradingStatus !== 'NOT_SUBMITTED';
    const isExamEnded = hasEssay
      ? attempt.gradingStatus === 'PUBLISHED'
      : Boolean(attempt.submittedAt)
        && (
          Boolean(config?.showResultImmediately)
          || attempt.status === 'GRADED'
          || Boolean(attempt.publishedAt)
        );
    const canStudentReview = Boolean(config?.allowReview)
      && isExamEnded
      && (
        Boolean(config?.showResultImmediately)
        || Boolean(attempt.publishedAt)
        || attempt.gradingStatus === 'PUBLISHED'
      );

    if (!isAdminOrTeacher && !canStudentReview) {
      throw new ForbiddenException('Phần đáp án và review chưa được công bố cho sinh viên');
    }

    const snapshotQuestions: any[] = (attempt.snapshot?.snapshotData as any[]) || [];
    const answersMap = new Map<string, any>();
    for (const ans of attempt.attemptAnswers) {
      answersMap.set(ans.questionId, ans);
    }

    const questionsReview = snapshotQuestions.map((q: any, idx: number) => {
      const studentAns = answersMap.get(q.questionId);
      const selectedOptionIds = (studentAns?.selectedOptionIds as string[]) || [];
      const textAnswer = studentAns?.textAnswer || '';
      const fillBlankAnswers = studentAns?.fillBlankAnswers || [];

      const correctOptionIds = (q.options || [])
        .filter((opt: any) => opt.isCorrect)
        .map((opt: any) => opt.id);

      let isCorrect = false;
      if (q.type === 'FILL_BLANK') {
        isCorrect = Boolean(studentAns?.isCorrect);
      } else {
        isCorrect =
          selectedOptionIds.length > 0 &&
          selectedOptionIds.length === correctOptionIds.length &&
          selectedOptionIds.every((id) => correctOptionIds.includes(id));
      }

      return {
        order: idx + 1,
        questionId: q.questionId,
        code: q.code || `Q${idx + 1}`,
        type: q.type || 'MULTIPLE_CHOICE',
        content: q.content,
        difficulty: q.difficulty,
        maxScore: q.score || 0.25,
        options: q.options || [],
        fillBlankAnswers: q.fillBlankAnswers || [],
        explanation: q.explanation || '',
        studentSelection: {
          selectedOptionIds,
          textAnswer,
          fillBlankAnswers,
          isCorrect: q.type === 'ESSAY' ? null : isCorrect,
          finalScore: q.type === 'ESSAY' ? studentAns?.finalScore : isCorrect ? (q.score || 0.25) : 0,
          teacherComment: studentAns?.teacherComment || '',
          essayGrades: studentAns?.essayGrades || [],
        },
      };
    });

    return {
      attemptId: attempt.id,
      student: {
        studentCode: attempt.student.studentCode,
        fullName: attempt.student.fullName,
        className: attempt.student.className,
      },
      paper: {
        paperCode: attempt.onlineExamConfig?.examPaper?.paperCode || 'STD',
        subjectName: attempt.onlineExamConfig?.examSchedule?.subject?.subjectName || 'Môn thi',
        durationMinutes: attempt.onlineExamConfig?.examPaper?.durationMinutes || 60,
      },
      attemptInfo: {
        status: attempt.status,
        startTime: attempt.startTime,
        submittedAt: attempt.submittedAt,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore || 10,
        riskScore: attempt.riskScore,
        isFlagged: attempt.isFlagged,
        gradingStatus: attempt.gradingStatus,
      },
      questions: questionsReview,
      incidents: attempt.incidents,
      proctoringEvents: isAdminOrTeacher ? attempt.proctoringEvents : [],
    };
  }

  /**
   * Gửi giải trình nếu phiên thi bị đánh dấu vi phạm
   */
  async submitAppeal(studentUserId: number, attemptId: string, appealText: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { student: true },
    });

    if (!attempt || attempt.student.userId !== studentUserId) {
      throw new ForbiddenException('Phiên thi không hợp lệ');
    }

    let incident = await this.prisma.examIncident.findFirst({
      where: { attemptId: attempt.id },
    });

    if (!incident) {
      incident = await this.prisma.examIncident.create({
        data: {
          attemptId: attempt.id,
          reportedById: 0,
          reason: 'Sinh viên chủ động nộp giải trình rủi ro hệ thống',
          studentAppeal: appealText,
        },
      });
    } else {
      incident = await this.prisma.examIncident.update({
        where: { id: incident.id },
        data: { studentAppeal: appealText },
      });
    }

    return {
      success: true,
      message: 'Gửi giải trình thành công. Ban tổ chức thi sẽ xem xét.',
      incident,
    };
  }

  /**
   * Báo cáo Tổng hợp Điểm & Kết quả Ca thi cho Giảng viên/Admin
   */
  async getGradeReport(actor: any, scheduleId: number) {
    await this.assertTeacherScheduleAccess(actor, scheduleId);

    const schedule: any = await this.prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        subject: true,
        examPeriod: true,
        examScheduleRooms: {
          include: {
            examRoomStudents: {
              include: {
                student: {
                  include: { class: true, user: { select: { id: true, username: true, email: true, role: true, status: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch thi');
    }

    const attempts: any[] = await this.prisma.examAttempt.findMany({
      where: {
        onlineExamConfig: {
          examScheduleId: scheduleId,
        },
      },
      include: {
        student: { include: { class: true, user: { select: { id: true, username: true, email: true, role: true, status: true } } } },
        incidents: true,
      },
    });

    const candidatesMap = new Map<number, any>();

    // Khởi tạo danh sách từ danh sách phòng thi
    for (const room of schedule.examScheduleRooms || []) {
      for (const rs of room.examRoomStudents || []) {
        const st = rs.student;
        if (st && !candidatesMap.has(st.id)) {
          candidatesMap.set(st.id, {
            studentId: st.id,
            studentCode: st.studentCode,
            fullName: st.fullName || st.user?.username || 'Sinh viên',
            className: st.class?.name || 'Chưa phân lớp',
            status: 'ABSENT',
            totalScore: 0,
            maxScore: 10,
            submittedAt: null,
            violationCount: 0,
          });
        }
      }
    }

    // Ghép dữ liệu bài làm của sinh viên
    for (const att of attempts) {
      const st = att.student;
      if (!st) continue;
      const existing = candidatesMap.get(st.id) || {
        studentId: st.id,
        studentCode: st.studentCode,
        fullName: st.fullName || st.user?.username || 'Sinh viên',
        className: st.class?.name || 'Chưa phân lớp',
      };

      candidatesMap.set(st.id, {
        ...existing,
        attemptId: att.id,
        status: att.status,
        totalScore: att.totalScore || 0,
        maxScore: att.maxScore || 10,
        submittedAt: att.submittedAt,
        violationCount: att.incidents?.length || 0,
      });
    }

    const candidates = Array.from(candidatesMap.values());
    const submittedCandidates = candidates.filter((c) =>
      ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED', 'UNDER_REVIEW'].includes(c.status),
    );

    const totalAssigned = candidates.length;
    const totalSubmitted = submittedCandidates.length;
    const totalAbsent = totalAssigned - totalSubmitted;

    const scores = submittedCandidates.map((c) => c.totalScore);
    const avgScore = scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0;
    const highestScore = scores.length ? Math.max(...scores) : 0;
    const lowestScore = scores.length ? Math.min(...scores) : 0;

    const passCount = submittedCandidates.filter((c) => c.totalScore >= 5.0).length;
    const passRate = totalSubmitted ? Number(((passCount / totalSubmitted) * 100).toFixed(1)) : 0;

    return {
      schedule: {
        id: schedule.id,
        subjectName: schedule.subject?.subjectName,
        subjectCode: schedule.subject?.subjectCode,
        periodName: schedule.examPeriod?.name,
        examDate: schedule.examDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
      stats: {
        totalAssigned,
        totalSubmitted,
        totalAbsent,
        avgScore,
        highestScore,
        lowestScore,
        passCount,
        passRate,
      },
      candidates,
    };
  }
}
