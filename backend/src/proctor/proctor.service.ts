import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProctorService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy dashboard danh sách sinh viên trong phòng thi realtime
   */
  async getLiveDashboard(teacherUserId: number, scheduleRoomId: number, userRole: string) {
    const scheduleRoom = await this.prisma.examScheduleRoom.findUnique({
      where: { id: scheduleRoomId },
      include: {
        examSchedule: {
          include: {
            subject: true,
            onlineExamConfig: true,
          },
        },
        room: true,
        supervisors: {
          include: { teacher: true },
        },
        examRoomStudents: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!scheduleRoom) {
      throw new NotFoundException('Không tìm thấy phòng thi');
    }

    // Kiểm tra giảng viên có được phân công coi phòng này không (trừ Admin)
    if (userRole !== 'ADMIN') {
      const isSupervisor = scheduleRoom.supervisors.some(
        (sup) => sup.teacher.userId === teacherUserId,
      );
      if (!isSupervisor) {
        throw new ForbiddenException('Bạn không được phân công giám thị phòng thi này');
      }
    }

    const configId = scheduleRoom.examSchedule.onlineExamConfig?.id;
    const studentIds = scheduleRoom.examRoomStudents.map((ers) => ers.studentId);

    // Lấy danh sách attempts của các sinh viên trong phòng này
    const attempts = configId
      ? await this.prisma.examAttempt.findMany({
          where: {
            onlineExamConfigId: configId,
            studentId: { in: studentIds },
          },
          include: {
            proctoringEvents: {
              orderBy: { occurredAt: 'desc' },
              take: 5,
            },
            incidents: true,
          },
        })
      : [];

    const attemptsMap = new Map(attempts.map((a) => [a.studentId, a]));

    const liveStudents = scheduleRoom.examRoomStudents.map((ers) => {
      const att = attemptsMap.get(ers.studentId);
      return {
        examNumber: ers.examNumber,
        seatNumber: ers.seatNumber,
        student: ers.student,
        attempt: att
          ? {
              id: att.id,
              status: att.status,
              attemptToken: att.attemptToken,
              startTime: att.startTime,
              expectedEndTime: att.expectedEndTime,
              extraMinutes: att.extraMinutes,
              submittedAt: att.submittedAt,
              riskScore: att.riskScore,
              isFlagged: att.isFlagged,
              recentEvents: att.proctoringEvents,
              incidents: att.incidents,
            }
          : null,
      };
    });

    // Thống kê tổng quan
    const stats = {
      total: liveStudents.length,
      notStarted: liveStudents.filter((s) => !s.attempt || s.attempt.status === 'NOT_STARTED').length,
      inProgress: liveStudents.filter((s) => s.attempt?.status === 'IN_PROGRESS').length,
      disconnected: liveStudents.filter((s) => s.attempt?.status === 'DISCONNECTED').length,
      submitted: liveStudents.filter(
        (s) => s.attempt && ['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED'].includes(s.attempt.status),
      ).length,
      flagged: liveStudents.filter((s) => s.attempt?.isFlagged).length,
    };

    return {
      scheduleRoomId,
      scheduleId: scheduleRoom.examSchedule.id,
      roomName: scheduleRoom.room.roomName,
      subjectName: scheduleRoom.examSchedule.subject.subjectName,
      examDate: scheduleRoom.examSchedule.examDate,
      startTime: scheduleRoom.examSchedule.startTime,
      endTime: scheduleRoom.examSchedule.endTime,
      stats,
      students: liveStudents,
    };
  }

  /**
   * Gia hạn thời gian làm bài cho sinh viên
   */
  async extendTime(teacherUserId: number, attemptId: string, extraMinutes: number, reason: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy phiên thi');
    }

    if (attempt.status !== 'IN_PROGRESS' && attempt.status !== 'DISCONNECTED') {
      throw new BadRequestException('Chỉ gia hạn thời gian cho bài thi đang làm');
    }
    if (!reason?.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do gia hạn thời gian');
    }
    if (!Number.isInteger(extraMinutes) || extraMinutes < 1 || extraMinutes > 60) {
      throw new BadRequestException('Số phút gia hạn phải là số nguyên từ 1 đến 60');
    }

    const currentExpected = attempt.expectedEndTime || new Date();
    const newExpected = new Date(currentExpected.getTime() + extraMinutes * 60 * 1000);

    const updated = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        expectedEndTime: newExpected,
        extraMinutes: attempt.extraMinutes + extraMinutes,
        extraTimeReason: reason,
      },
    });

    // Ghi audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'EXTEND_EXAM_TIME',
        entityType: 'ExamAttempt',
        entityId: attemptId,
        description: `Giám thị gia hạn thêm ${extraMinutes} phút. Lý do: ${reason}`,
      },
    });

    return {
      success: true,
      message: `Đã gia hạn thêm ${extraMinutes} phút thành công`,
      newExpectedEndTime: updated.expectedEndTime,
    };
  }

  /**
   * Gia hạn bù giờ hàng loạt cho toàn bộ sinh viên trong phòng thi khi gặp sự cố
   */
  async bulkExtendTime(teacherUserId: number, scheduleRoomId: number, extraMinutes: number, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do gia hạn bù giờ toàn phòng thi');
    }
    if (!Number.isInteger(extraMinutes) || extraMinutes < 1 || extraMinutes > 60) {
      throw new BadRequestException('Số phút gia hạn phải là số nguyên từ 1 đến 60');
    }

    const scheduleRoom = await this.prisma.examScheduleRoom.findUnique({
      where: { id: scheduleRoomId },
      include: {
        examSchedule: { include: { onlineExamConfig: true } },
        examRoomStudents: { select: { studentId: true } },
      },
    });

    if (!scheduleRoom) {
      throw new NotFoundException('Không tìm thấy phòng thi');
    }

    const configId = scheduleRoom.examSchedule.onlineExamConfig?.id;
    const studentIds = scheduleRoom.examRoomStudents.map((ers) => ers.studentId);

    const attempts = configId && studentIds.length
      ? await this.prisma.examAttempt.findMany({
          where: {
            onlineExamConfigId: configId,
            studentId: { in: studentIds },
            status: { in: ['IN_PROGRESS', 'DISCONNECTED'] },
          },
        })
      : [];

    if (!attempts.length) {
      throw new BadRequestException('Không có bài thi nào đang làm hoặc bị ngắt kết nối trong phòng để bù giờ.');
    }

    const now = new Date();

    for (const attempt of attempts) {
      const currentExpected = attempt.expectedEndTime && attempt.expectedEndTime > now ? attempt.expectedEndTime : now;
      const newExpected = new Date(currentExpected.getTime() + extraMinutes * 60 * 1000);

      await this.prisma.examAttempt.update({
        where: { id: attempt.id },
        data: {
          expectedEndTime: newExpected,
          extraMinutes: attempt.extraMinutes + extraMinutes,
          extraTimeReason: reason,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'BULK_EXTEND_EXAM_TIME',
        entityType: 'ExamScheduleRoom',
        entityId: String(scheduleRoomId),
        description: `Giám thị cộng bù giờ hàng loạt +${extraMinutes} phút cho ${attempts.length} sinh viên phòng thi. Lý do: ${reason}`,
      },
    });

    return {
      success: true,
      count: attempts.length,
      message: `Đã bù giờ +${extraMinutes} phút thành công cho ${attempts.length} sinh viên trong phòng thi`,
    };
  }

  /**
   * Cho phép sinh viên mở lại bài khi sự cố / rớt mạng
   */
  async reopenAttempt(teacherUserId: number, attemptId: string, reason: string, penaltyPoints = 0) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy phiên thi');
    }

    if (!['SUBMITTED', 'AUTO_SUBMITTED', 'GRADED', 'DISCONNECTED', 'UNDER_REVIEW', 'READY'].includes(attempt.status) && !attempt.isFlagged) {
      throw new BadRequestException('Chỉ có thể mở lại phiên đã nộp, tự động nộp, bị gián đoạn hoặc bị tạm khóa xem xét');
    }
    if (!reason?.trim()) {
      throw new BadRequestException('Vui lòng nhập lý do mở lại phiên thi');
    }

    const penalty = Math.max(0, Math.min(Number(penaltyPoints) || 0, attempt.maxScore || 10));

    const updated = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'IN_PROGRESS',
        isFlagged: false,
        penaltyPoints: penalty,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: teacherUserId,
        action: 'REOPEN_EXAM_ATTEMPT',
        entityType: 'ExamAttempt',
        entityId: attemptId,
        description: `Giám thị mở lại bài thi cho sinh viên.${penalty > 0 ? ` Thiết lập điểm trừ vi phạm: ${penalty} điểm.` : ''} Lý do: ${reason}`,
      },
    });

    return {
      success: true,
      message: `Đã mở lại bài thi cho sinh viên${penalty > 0 ? ` (Điểm phạt vi phạm: ${penalty} điểm)` : ''}`,
      status: updated.status,
    };
  }

  /**
   * Lập biên bản vi phạm / Gắn cờ xem xét
   */
  async flagIncident(teacherUserId: number, attemptId: string, reason: string, decision: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy phiên thi');
    }

    const incident = await this.prisma.examIncident.create({
      data: {
        attemptId,
        reportedById: teacherUserId,
        reason,
        decision: decision || 'UNDER_REVIEW',
      },
    });

    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        isFlagged: true,
        status: decision === 'TERMINATED' ? 'TERMINATED' : attempt.status,
      },
    });

    return {
      success: true,
      message: 'Đã lập biên bản sự cố thành công',
      incident,
    };
  }

  async resolveIncident(
    actorId: number,
    attemptId: string,
    decision: 'REOPEN' | 'PENALTY' | 'TERMINATE',
    penaltyPoints: number,
    note: string,
  ) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { incidents: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!attempt) throw new NotFoundException('Không tìm thấy phiên thi');
    const incident = attempt.incidents[0];
    if (!incident) throw new BadRequestException('Phiên thi chưa có biên bản vi phạm để xử lý');

    const penalty = Math.max(0, Math.min(Number(penaltyPoints) || 0, attempt.maxScore || 10));
    const now = new Date();
    const data: any = { isFlagged: false };
    if (decision === 'REOPEN') {
      data.status = 'IN_PROGRESS';
      data.submittedAt = null;
      data.endTime = null;
      data.expectedEndTime = new Date(Math.max(now.getTime(), attempt.expectedEndTime?.getTime() || 0) + 60 * 60 * 1000);
    } else if (decision === 'PENALTY') {
      data.status = 'GRADED';
      data.penaltyPoints = (attempt.penaltyPoints || 0) + penalty;
      data.totalScore = Math.max(0, (attempt.totalScore || 0) - penalty);
    } else {
      data.status = 'TERMINATED';
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.examAttempt.update({ where: { id: attemptId }, data });
      await tx.examIncident.update({
        where: { id: incident.id },
        data: {
          decision,
          resolvedAt: now,
          reviewerNote: note || null,
        } as any,
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'RESOLVE_EXAM_INCIDENT',
          entityType: 'ExamAttempt',
          entityId: attemptId,
          description: `Xử lý biên bản vi phạm: ${decision}${decision === 'PENALTY' ? `, trừ ${penalty} điểm` : ''}. ${note}`,
        },
      });
      return next;
    });
    return { success: true, decision, penaltyPoints: penalty, status: updated.status, message: 'Đã xử lý giải trình và cập nhật phiên thi' };
  }
}
