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
   * Cho phép sinh viên mở lại bài khi sự cố / rớt mạng
   */
  async reopenAttempt(teacherUserId: number, attemptId: string, reason: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy phiên thi');
    }

    const updated = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'IN_PROGRESS',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'REOPEN_EXAM_ATTEMPT',
        entityType: 'ExamAttempt',
        entityId: attemptId,
        description: `Giám thị mở lại bài thi cho sinh viên. Lý do: ${reason}`,
      },
    });

    return {
      success: true,
      message: 'Đã mở lại bài thi cho sinh viên',
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
}
