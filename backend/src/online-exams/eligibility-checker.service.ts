import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ===================================================================
// ENUM: Mã lỗi điều kiện dự thi
// ===================================================================
export enum EligibilityErrorCode {
  // Sinh viên & tài khoản
  STUDENT_NOT_FOUND = 'STUDENT_NOT_FOUND',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  STUDENT_NOT_ELIGIBLE = 'STUDENT_NOT_ELIGIBLE', // Không trong danh sách dự thi
  STUDENT_BANNED = 'STUDENT_BANNED', // Sinh viên bị cấm thi / đình chỉ
  STUDENT_SUBJECT_NOT_ELIGIBLE = 'STUDENT_SUBJECT_NOT_ELIGIBLE', // Không đủ điều kiện môn học

  // Kỳ thi & lịch thi
  SCHEDULE_NOT_FOUND = 'SCHEDULE_NOT_FOUND',
  EXAM_NOT_ONLINE = 'EXAM_NOT_ONLINE', // Lịch thi này không phải hình thức online
  EXAM_NOT_CONFIGURED = 'EXAM_NOT_CONFIGURED', // Chưa có OnlineExamConfig
  EXAM_NOT_ACTIVE = 'EXAM_NOT_ACTIVE', // Kỳ thi không ở trạng thái cho phép
  EXAM_PERIOD_NOT_ACTIVE = 'EXAM_PERIOD_NOT_ACTIVE', // Đợt thi chưa active

  // Thời gian
  EXAM_NOT_STARTED = 'EXAM_NOT_STARTED', // Chưa đến giờ thi
  EXAM_LATE_ENTRY_EXPIRED = 'EXAM_LATE_ENTRY_EXPIRED', // Đã quá giờ vào thi
  EXAM_ENDED = 'EXAM_ENDED', // Kỳ thi đã kết thúc

  // Lượt thi
  ALREADY_SUBMITTED = 'ALREADY_SUBMITTED', // Đã nộp bài rồi
  ACTIVE_SESSION_EXISTS = 'ACTIVE_SESSION_EXISTS', // Có phiên khác đang hoạt động
  MAX_ATTEMPTS_EXCEEDED = 'MAX_ATTEMPTS_EXCEEDED', // Đã dùng hết số lần thi

  // Bảo mật & truy cập
  IP_NOT_ALLOWED = 'IP_NOT_ALLOWED', // IP không được phép
  DEVICE_NOT_REGISTERED = 'DEVICE_NOT_REGISTERED', // Thiết bị chưa đăng ký
  ACCESS_CODE_REQUIRED = 'ACCESS_CODE_REQUIRED', // Cần mã truy cập phòng thi
  ACCESS_CODE_INVALID = 'ACCESS_CODE_INVALID', // Mã truy cập sai

  // Quy định & thiết bị kiểm tra
  RULES_NOT_ACCEPTED = 'RULES_NOT_ACCEPTED', // Chưa đồng ý quy định thi
  DEVICE_CHECK_REQUIRED = 'DEVICE_CHECK_REQUIRED', // Chưa kiểm tra thiết bị
  WEBCAM_REQUIRED = 'WEBCAM_REQUIRED', // Kỳ thi yêu cầu webcam nhưng sinh viên chưa cung cấp
}

// ===================================================================
// INTERFACE: Kết quả kiểm tra điều kiện
// ===================================================================
export interface EligibilityResult {
  isEligible: boolean;
  errorCode?: EligibilityErrorCode;
  reason?: string;
  data?: {
    student?: any;
    schedule?: any;
    config?: any;
    roomStudentInfo?: any;
    existingAttempt?: any;
    serverTime?: Date;
    examStartTime?: Date;
    examEndTime?: Date;
    remainingEntrySeconds?: number;
  };
}

// ===================================================================
// INPUT: Dữ liệu đầu vào cho bộ kiểm tra
// ===================================================================
export interface EligibilityInput {
  studentUserId: number;
  scheduleId: number;
  clientIp?: string;
  deviceFingerprint?: string;
  providedAccessCode?: string;
  webcamAvailable?: boolean;
  deviceCheckPassed?: boolean;
}

@Injectable()
export class EligibilityCheckerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kiểm tra toàn bộ điều kiện dự thi theo chuẩn nghiệp vụ khảo thí
   *
   * Thứ tự kiểm tra:
   * 1. Tìm & xác thực sinh viên + tài khoản
   * 2. Tìm & xác thực lịch thi
   * 3. Kiểm tra sinh viên có trong danh sách dự thi
   * 4. Kiểm tra trạng thái kỳ thi
   * 5. Kiểm tra thời gian (không quá sớm, không quá muộn)
   * 6. Kiểm tra lượt thi & phiên hiện tại
   * 7. Kiểm tra bảo mật truy cập (IP, Device, Access Code)
   * 8. Kiểm tra quy định & thiết bị
   */
  async check(input: EligibilityInput): Promise<EligibilityResult> {
    const {
      studentUserId,
      scheduleId,
      clientIp,
      deviceFingerprint,
      providedAccessCode,
      webcamAvailable,
      deviceCheckPassed,
    } = input;

    // ─────────────────────────────────────────
    // BƯỚC 1: Tải thông tin sinh viên
    // ─────────────────────────────────────────
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        user: true,
        studentSubjects: true,
      },
    });

    if (!student) {
      return this.fail(EligibilityErrorCode.STUDENT_NOT_FOUND, 'Không tìm thấy thông tin sinh viên');
    }

    // Kiểm tra tài khoản bị khóa hay không
    if (student.user.status === 'LOCKED' || student.user.status === 'SUSPENDED') {
      return this.fail(EligibilityErrorCode.ACCOUNT_LOCKED, 'Tài khoản sinh viên đang bị khóa');
    }

    if (student.user.status !== 'ACTIVE') {
      return this.fail(EligibilityErrorCode.ACCOUNT_INACTIVE, 'Tài khoản sinh viên không hoạt động');
    }

    // Kiểm tra sinh viên bị đình chỉ thi (status trên Student record)
    if ((student as any).status === 'BANNED' || (student as any).status === 'SUSPENDED') {
      return this.fail(EligibilityErrorCode.STUDENT_BANNED, 'Sinh viên đang bị đình chỉ thi');
    }

    // ─────────────────────────────────────────
    // BƯỚC 2: Tải lịch thi và cấu hình online
    // ─────────────────────────────────────────
    const schedule = await this.prisma.examSchedule.findFirst({
      where: { id: scheduleId, deletedAt: null },
      include: {
        examPeriod: true,
        subject: true,
        examScheduleRooms: {
          include: {
            examRoomStudents: {
              where: { studentId: student.id },
            },
          },
        },
        onlineExamConfig: {
          include: {
            examPaper: true,
          },
        },
      },
    });

    if (!schedule) {
      return this.fail(EligibilityErrorCode.SCHEDULE_NOT_FOUND, 'Không tìm thấy lịch thi');
    }

    // ─────────────────────────────────────────
    // BƯỚC 3: Kiểm tra sinh viên trong danh sách dự thi
    // ─────────────────────────────────────────
    let isAssigned = false;
    let roomStudentInfo: any = null;

    for (const room of schedule.examScheduleRooms) {
      if (room.examRoomStudents && room.examRoomStudents.length > 0) {
        isAssigned = true;
        roomStudentInfo = room.examRoomStudents[0];
        break;
      }
    }

    if (!isAssigned) {
      return this.fail(
        EligibilityErrorCode.STUDENT_NOT_ELIGIBLE,
        'Sinh viên không có tên trong danh sách dự thi ca thi này',
        { student, schedule },
      );
    }

    // Kiểm tra trạng thái chỗ ngồi sinh viên trong phòng (nếu bị cấm)
    if (roomStudentInfo?.status === 'BANNED' || roomStudentInfo?.status === 'DISQUALIFIED') {
      return this.fail(
        EligibilityErrorCode.STUDENT_BANNED,
        'Sinh viên đã bị cấm tham dự ca thi này',
        { student, schedule },
      );
    }

    // ─────────────────────────────────────────
    // BƯỚC 4: Kiểm tra trạng thái kỳ thi
    // ─────────────────────────────────────────
    const VALID_SCHEDULE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'ONGOING'];
    if (!VALID_SCHEDULE_STATUSES.includes(schedule.status)) {
      return this.fail(
        EligibilityErrorCode.EXAM_NOT_ACTIVE,
        `Lịch thi không ở trạng thái cho phép dự thi (hiện tại: ${schedule.status})`,
        { student, schedule },
      );
    }

    // Kiểm tra đợt thi có đang hoạt động
    const VALID_PERIOD_STATUSES = ['ONGOING', 'ACTIVE', 'IN_PROGRESS'];
    if (!VALID_PERIOD_STATUSES.includes(schedule.examPeriod.status)) {
      return this.fail(
        EligibilityErrorCode.EXAM_PERIOD_NOT_ACTIVE,
        'Đợt thi hiện tại chưa được kích hoạt hoặc đã kết thúc',
        { student, schedule },
      );
    }

    // Kiểm tra đây có phải lịch thi online không
    if (schedule.examType !== 'TRAC_NGHIEM' && schedule.examType !== 'ONLINE') {
      return this.fail(
        EligibilityErrorCode.EXAM_NOT_ONLINE,
        'Lịch thi này không phải hình thức thi trực tuyến',
        { student, schedule },
      );
    }

    // Kiểm tra cấu hình thi online và Đề thi chính thức đã được phát hành chưa
    let config = schedule.onlineExamConfig;
    if (!config || !config.examPaper) {
      const publishedPaper = await this.prisma.examPaper.findFirst({
        where: { examScheduleId: scheduleId, status: 'PUBLISHED', deletedAt: null },
        include: { questions: true },
        orderBy: { publishedAt: 'desc' },
      });

      if (publishedPaper) {
        config = await this.prisma.onlineExamConfig.upsert({
          where: { examScheduleId: scheduleId },
          update: { examPaperId: publishedPaper.id },
          create: { examScheduleId: scheduleId, examPaperId: publishedPaper.id },
          include: { examPaper: true },
        });
      }
    }

    if (!config || !config.examPaper || config.examPaper.status !== 'PUBLISHED') {
      return this.fail(
        EligibilityErrorCode.EXAM_NOT_CONFIGURED,
        'Ca thi chưa được Quản trị viên/Giảng viên chọn và phát hành đề thi chính thức (PUBLISHED).',
        { student, schedule },
      );
    }

    // ─────────────────────────────────────────
    // BƯỚC 5: Kiểm tra lượt thi & phiên thi hiện tại
    // ─────────────────────────────────────────
    const allAttempts = await this.prisma.examAttempt.findMany({
      where: {
        onlineExamConfigId: config.id,
        studentId: student.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Kiểm tra sinh viên đã nộp bài
    const submittedAttempt = allAttempts.find((a) =>
      ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED', 'TERMINATED'].includes(a.status),
    );
    if (submittedAttempt) {
      return this.fail(
        EligibilityErrorCode.ALREADY_SUBMITTED,
        'Sinh viên đã nộp bài thi. Không thể dự thi lại.',
        { student, schedule, config, existingAttempt: submittedAttempt },
      );
    }

    // Kiểm tra phiên đang hoạt động (để phục hồi, không phải block hoàn toàn)
    const activeAttempt = allAttempts.find((a) =>
      ['IN_PROGRESS', 'DISCONNECTED', 'DEVICE_CHECK', 'READY'].includes(a.status),
    );

    // Kiểm tra giới hạn số lần thi
    const completedAttempts = allAttempts.filter((a) =>
      ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED', 'TERMINATED', 'INVALIDATED'].includes(a.status),
    );
    if (completedAttempts.length >= config.maxAttempts && !activeAttempt) {
      return this.fail(
        EligibilityErrorCode.MAX_ATTEMPTS_EXCEEDED,
        `Đã sử dụng hết ${config.maxAttempts} lần thi được phép`,
        { student, schedule, config, existingAttempt: completedAttempts[0] },
      );
    }

    // ─────────────────────────────────────────
    // BƯỚC 6: Kiểm tra thời gian
    // ─────────────────────────────────────────
    const serverTime = new Date();
    const examStartTime = this.buildExamDateTime(schedule.examDate, schedule.startTime);
    const examEndTime = this.buildExamDateTime(schedule.examDate, schedule.endTime);
    const lateEntryDeadline = new Date(examStartTime.getTime() + (config.lateEntryWindowMinutes || 60) * 60 * 1000);

    // Chưa đến giờ thi
    if (serverTime < examStartTime) {
      const diffSeconds = Math.floor((examStartTime.getTime() - serverTime.getTime()) / 1000);
      return this.fail(
        EligibilityErrorCode.EXAM_NOT_STARTED,
        `Chưa đến giờ thi. Kỳ thi bắt đầu lúc ${this.formatTime(examStartTime)}`,
        { student, schedule, config, examStartTime, examEndTime, serverTime, existingAttempt: activeAttempt },
      );
    }

    // Đã quá giờ vào thi (trễ hơn cửa sổ cho phép vào muộn)
    if (serverTime > lateEntryDeadline) {
      return this.fail(
        EligibilityErrorCode.EXAM_LATE_ENTRY_EXPIRED,
        `Đã quá thời hạn vào thi. Chỉ cho phép vào muộn tối đa ${config.lateEntryWindowMinutes} phút`,
        { student, schedule, config, examStartTime, examEndTime, serverTime, existingAttempt: activeAttempt },
      );
    }

    // Kỳ thi đã kết thúc
    if (serverTime > examEndTime) {
      return this.fail(
        EligibilityErrorCode.EXAM_ENDED,
        `Kỳ thi đã kết thúc lúc ${this.formatTime(examEndTime)}`,
        { student, schedule, config, examEndTime, serverTime, existingAttempt: activeAttempt },
      );
    }

    // ─────────────────────────────────────────
    // BƯỚC 7: Kiểm tra bảo mật truy cập
    // ─────────────────────────────────────────

    // 7a. Kiểm tra IP whitelist
    const ipWhitelist: string[] = (config.ipWhitelist as string[]) || [];
    if (ipWhitelist.length > 0 && clientIp) {
      const isIpAllowed = this.checkIpWhitelist(clientIp, ipWhitelist);
      if (!isIpAllowed) {
        return this.fail(
          EligibilityErrorCode.IP_NOT_ALLOWED,
          `Địa chỉ IP ${clientIp} không nằm trong danh sách được phép thi`,
          { student, schedule, config },
        );
      }
    }

    // 7b. Kiểm tra thiết bị đã đăng ký (Device Binding)
    if (config.requireDeviceBinding && deviceFingerprint) {
      const registeredDevice = await this.prisma.deviceSession.findFirst({
        where: {
          deviceInfo: { contains: deviceFingerprint },
          attempt: {
            studentId: student.id,
            status: 'IN_PROGRESS',
          },
        },
      });
      // Nếu chưa có thiết bị đã đăng ký và requireDeviceBinding = true
      // (Logic chi tiết hơn sẽ cần bảng riêng - hiện tại cho qua nếu chưa có lịch sử)
    } else if (config.requireDeviceBinding && !deviceFingerprint) {
      return this.fail(
        EligibilityErrorCode.DEVICE_NOT_REGISTERED,
        'Kỳ thi yêu cầu xác thực thiết bị nhưng không nhận được thông tin thiết bị',
        { student, schedule, config },
      );
    }

    // 7c. Kiểm tra mã truy cập phòng thi
    if (config.accessCode) {
      if (!providedAccessCode) {
        return this.fail(
          EligibilityErrorCode.ACCESS_CODE_REQUIRED,
          'Kỳ thi yêu cầu mã truy cập phòng thi (access code)',
          { student, schedule, config },
        );
      }
      if (providedAccessCode !== config.accessCode) {
        return this.fail(
          EligibilityErrorCode.ACCESS_CODE_INVALID,
          'Mã truy cập phòng thi không đúng',
          { student, schedule, config },
        );
      }
    }

    // ─────────────────────────────────────────
    // BƯỚC 8: Kiểm tra quy định & thiết bị (chỉ khi bắt đầu lần đầu)
    // ─────────────────────────────────────────
    // Nếu không có phiên đang hoạt động (lần thi mới), kiểm tra thêm:
    if (!activeAttempt) {
      // 8a. Kiểm tra đã chấp nhận quy định thi (rules acceptance được thực hiện ở step start)
      // Điều kiện này được validate riêng trong endpoint acceptRules -> sẽ check attemp.rulesAcceptedAt
      // Ở đây chỉ flag requireRulesAcceptance để frontend biết cần hiển thị màn hình

      // 8b. Kiểm tra webcam nếu kỳ thi yêu cầu
      if (config.requireWebcam && webcamAvailable === false) {
        return this.fail(
          EligibilityErrorCode.WEBCAM_REQUIRED,
          'Kỳ thi yêu cầu webcam nhưng không tìm thấy thiết bị camera',
          { student, schedule, config },
        );
      }
    }

    // ─────────────────────────────────────────
    // ĐỦ ĐIỀU KIỆN - Trả về kết quả thành công
    // ─────────────────────────────────────────
    const remainingEntrySeconds = Math.max(
      0,
      Math.floor((lateEntryDeadline.getTime() - serverTime.getTime()) / 1000),
    );

    return {
      isEligible: true,
      data: {
        student,
        schedule,
        config,
        roomStudentInfo,
        existingAttempt: activeAttempt
          ? {
              id: activeAttempt.id,
              status: activeAttempt.status,
              attemptToken: activeAttempt.attemptToken,
              startTime: activeAttempt.startTime,
              expectedEndTime: activeAttempt.expectedEndTime,
            }
          : null,
        serverTime,
        examStartTime,
        examEndTime,
        remainingEntrySeconds,
      },
    };
  }

  // ───────────────────────────────────────────────────────
  // Private Helpers
  // ───────────────────────────────────────────────────────

  private fail(
    errorCode: EligibilityErrorCode,
    reason: string,
    data?: Record<string, any>,
  ): EligibilityResult {
    return {
      isEligible: false,
      errorCode,
      reason,
      data,
    };
  }

  /**
   * Kết hợp ngày thi với chuỗi giờ "HH:mm" thành một DateTime hoàn chỉnh
   */
  private buildExamDateTime(examDate: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const dt = new Date(examDate);
    dt.setHours(hours, minutes, 0, 0);
    return dt;
  }

  private formatTime(dt: Date): string {
    return dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Kiểm tra clientIp có nằm trong whitelist không
   * Hỗ trợ: IP đơn (192.168.1.1) và prefix/subnet đơn giản (192.168.1.)
   */
  private checkIpWhitelist(clientIp: string, whitelist: string[]): boolean {
    return whitelist.some((entry) => {
      // Exact match
      if (clientIp === entry) return true;
      // Prefix match (ví dụ: "192.168.1." khớp với "192.168.1.100")
      if (entry.endsWith('.') && clientIp.startsWith(entry)) return true;
      // CIDR (TODO: cần lib `ip-cidr` cho production)
      return false;
    });
  }
}
