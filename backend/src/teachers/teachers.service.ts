import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationTypeDto } from '../notifications/dto/notification.dto';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async setLock(actor: { id: number }, id: number, locked: boolean) {
    const teacher = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: teacher.userId }, data: { status: locked ? 'LOCKED' : 'ACTIVE' }, include: { teacher: true } });
      await this.audit.write({ actorId: actor.id, action: locked ? 'LOCK' : 'UNLOCK', entityType: 'TEACHER', entityId: id, description: `${locked ? 'Đã khóa' : 'Đã mở khóa'} giảng viên ${teacher.fullName}` }, tx);
      return updated;
    });
  }

  async findAll() {
    return this.prisma.teacher.findMany({
      include: {
        department: true,
        user: { select: { id: true, username: true, email: true, role: true, status: true } },
      },
      orderBy: { teacherCode: 'asc' },
    });
  }

  async findOne(id: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        department: true,
        user: { select: { id: true, username: true, email: true, role: true, status: true } },
        supervisors: {
          include: {
            examScheduleRoom: {
              include: {
                room: true,
                examSchedule: {
                  include: { subject: true, examPeriod: true },
                },
              },
            },
          },
        },
      },
    });
    if (!teacher) throw new NotFoundException('Không tìm thấy giảng viên.');
    return teacher;
  }

  async create(data: {
    teacherCode: string;
    fullName: string;
    degree: string;
    email: string;
    phone?: string;
    departmentId: number;
    username?: string;
    password?: string;
  }) {
    const existingCode = await this.prisma.teacher.findUnique({
      where: { teacherCode: data.teacherCode },
    });
    if (existingCode) throw new BadRequestException('Mã giảng viên đã tồn tại.');

    const username = data.username || data.teacherCode;
    const rawPassword = data.password || data.teacherCode;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    return this.prisma.$transaction(async (tx) => {
      const [department, existingUser] = await Promise.all([
        tx.department.findUnique({ where: { id: data.departmentId } }),
        tx.user.findFirst({ where: { OR: [{ username }, { email: data.email }] } }),
      ]);
      if (!department) throw new BadRequestException('Khoa được chọn không tồn tại.');
      if (existingUser) throw new BadRequestException('Tên đăng nhập hoặc email đã tồn tại.');
      const user = await tx.user.create({
        data: { username, password: hashedPassword, email: data.email, role: 'TEACHER', status: 'ACTIVE' },
      });
      return tx.teacher.create({
        data: {
          teacherCode: data.teacherCode,
          fullName: data.fullName,
          degree: data.degree,
          email: data.email,
          phone: data.phone,
          departmentId: data.departmentId,
          userId: user.id,
        },
        include: { department: true, user: { select: { id: true, username: true, email: true, role: true, status: true } } },
      });
    });
  }

  async update(
    id: number,
    data: {
      teacherCode?: string;
      fullName?: string;
      degree?: string;
      email?: string;
      phone?: string;
      departmentId?: number;
    },
  ) {
    const teacher = await this.findOne(id);
    if (teacher.user.status === 'LOCKED') {
      throw new BadRequestException('Giảng viên đã khóa, chỉ được mở khóa trước khi thay đổi.');
    }
    return this.prisma.$transaction(async (tx) => {
      if (data.teacherCode && data.teacherCode !== teacher.teacherCode) {
        const existingTeacher = await tx.teacher.findUnique({ where: { teacherCode: data.teacherCode } });
        if (existingTeacher) throw new BadRequestException('Mã giảng viên đã tồn tại.');
      }
      if (data.departmentId && !await tx.department.findUnique({ where: { id: data.departmentId } })) {
        throw new BadRequestException('Khoa được chọn không tồn tại.');
      }
      if (data.email && data.email !== teacher.email) {
        const existingUser = await tx.user.findFirst({ where: { email: data.email, id: { not: teacher.userId } } });
        if (existingUser) throw new BadRequestException('Email đã được sử dụng.');
        await tx.user.update({ where: { id: teacher.userId }, data: { email: data.email } });
      }
      return tx.teacher.update({ where: { id }, data, include: { department: true, user: { select: { id: true, username: true, email: true, role: true, status: true } } } });
    });
  }

  async remove(id: number) {
    const teacher = await this.findOne(id);
    if (teacher.supervisors.length > 0) throw new BadRequestException('Không thể xóa giảng viên đã có phân công coi thi.');
    await this.prisma.$transaction(async (tx) => {
      await tx.teacher.delete({ where: { id } });
      await tx.user.delete({ where: { id: teacher.userId } });
    });
    return { message: 'Đã xóa giảng viên thành công' };
  }

  async getMyAssignments(userId: number) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) throw new NotFoundException('Không tìm thấy thông tin giảng viên.');

    const assignments = await this.prisma.examSupervisor.findMany({
      where: {
        teacherId: teacher.id,
        examScheduleRoom: { examSchedule: { status: { not: 'CANCELLED' } } },
      },
      include: {
        examScheduleRoom: {
          include: {
            room: true,
            examSchedule: {
              include: {
                subject: true,
                examPeriod: true,
              },
            },
          },
        },
      },
      orderBy: {
        examScheduleRoom: {
          examSchedule: {
            examDate: 'asc',
          },
        },
      },
    });

    return assignments.map((a) => ({
      id: a.id,
      role: a.role,
      status: a.status || 'PENDING',
      note: a.note,
      examScheduleRoomId: a.examScheduleRoomId,
      scheduleId: a.examScheduleRoom.examScheduleId,
      subjectCode: a.examScheduleRoom.examSchedule.subject.subjectCode,
      subjectName: a.examScheduleRoom.examSchedule.subject.subjectName,
      examDate: a.examScheduleRoom.examSchedule.examDate,
      startTime: a.examScheduleRoom.examSchedule.startTime,
      endTime: a.examScheduleRoom.examSchedule.endTime,
      roomCode: a.examScheduleRoom.room.roomCode,
      roomName: a.examScheduleRoom.room.roomName,
      building: a.examScheduleRoom.room.building,
      periodName: a.examScheduleRoom.examSchedule.examPeriod.name,
    }));
  }

  async updateAssignmentStatus(userId: number, assignmentId: number, status: string, note?: string) {
    if (status === 'CONFIRMED') return this.confirmMyAssignment(userId, assignmentId);
    if (status === 'CHANGE_REQUESTED') return this.requestAssignmentChange(userId, assignmentId, note || 'Giảng viên đề nghị đổi ca coi thi.');
    throw new BadRequestException('Giảng viên chỉ có thể xác nhận hoặc gửi yêu cầu đổi ca.');
  }

  async confirmMyAssignment(userId: number, assignmentId: number) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Không tìm thấy giảng viên.');

    const supervisor: any = await this.prisma.examSupervisor.findFirst({
      where: { id: assignmentId, teacherId: teacher.id },
      include: {
        examScheduleRoom: {
          include: { examSchedule: true },
        },
      },
    });

    if (!supervisor) {
      throw new NotFoundException('Không tìm thấy phân công coi thi.');
    }

    if (supervisor.status === 'CONFIRMED') return supervisor;
    if (supervisor.status === 'CHANGE_REQUESTED') throw new BadRequestException('Yêu cầu đổi ca đang chờ quản trị viên xử lý.');

    const examDate = new Date(supervisor.examScheduleRoom?.examSchedule?.examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (examDate.getTime() < today.getTime()) {
      throw new BadRequestException('Ca thi đã quá thời hạn. Không thể điều chỉnh trạng thái.');
    }

    const updated = await this.prisma.examSupervisor.update({
      where: { id: assignmentId },
      data: { status: 'CONFIRMED' },
    });
    await this.audit.write({ actorId: userId, action: 'CONFIRM', entityType: 'EXAM_SUPERVISOR', entityId: assignmentId, description: `Giảng viên ${teacher.fullName} đã xác nhận ca coi thi.` });
    return updated;
  }

  async requestAssignmentChange(userId: number, assignmentId: number, reason: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Không tìm thấy giảng viên.');
    const supervisor = await this.prisma.examSupervisor.findFirst({
      where: { id: assignmentId, teacherId: teacher.id },
      include: { examScheduleRoom: { include: { room: true, examSchedule: { include: { subject: true } } } } },
    });
    if (!supervisor) throw new NotFoundException('Không tìm thấy phân công coi thi.');
    if (!['PENDING', 'CONFIRMED'].includes(supervisor.status)) throw new BadRequestException('Ca này không ở trạng thái có thể yêu cầu đổi.');
    if (new Date(supervisor.examScheduleRoom.examSchedule.examDate).getTime() < new Date().setHours(0, 0, 0, 0)) throw new BadRequestException('Ca thi đã qua, không thể gửi yêu cầu đổi ca.');
    const pending = await this.prisma.supervisorChangeRequest.findFirst({ where: { examSupervisorId: assignmentId, status: 'PENDING' } });
    if (pending) throw new BadRequestException('Ca này đã có yêu cầu đổi đang chờ duyệt.');

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supervisorChangeRequest.create({ data: { examSupervisorId: assignmentId, requesterTeacherId: teacher.id, reason } });
      await tx.examSupervisor.update({ where: { id: assignmentId }, data: { status: 'CHANGE_REQUESTED' } });
      await this.audit.write({ actorId: userId, action: 'REQUEST_CHANGE', entityType: 'EXAM_SUPERVISOR', entityId: assignmentId, description: `Giảng viên ${teacher.fullName} xin đổi ca tại phòng ${supervisor.examScheduleRoom.room.roomCode}.`, metadata: { changeRequestId: created.id, reason } }, tx);
      return created;
    });
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' }, select: { id: true } });
    await this.notifications.createBulk(admins.map((admin) => ({ userId: admin.id, type: NotificationTypeDto.ASSIGNMENT_UPDATE, title: 'Có yêu cầu đổi ca coi thi', message: `${teacher.fullName} xin đổi ca môn ${supervisor.examScheduleRoom.examSchedule.subject.subjectName}, phòng ${supervisor.examScheduleRoom.room.roomCode}.`, link: '/exam-supervisors', metadata: { changeRequestId: request.id, assignmentId } })));
    return request;
  }

  async getMyDutyAvailability(userId: number) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Không tìm thấy thông tin giảng viên.');
    return this.prisma.teacherDutyAvailability.findMany({ where: { teacherId: teacher.id }, orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }] });
  }

  async getSupervisorChangeRequests(status?: string) {
    return this.prisma.supervisorChangeRequest.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        requesterTeacher: true,
        replacementTeacher: true,
        examSupervisor: {
          include: {
            examScheduleRoom: {
              include: { room: true, examSchedule: { include: { subject: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEligibleReplacementTeachers(requestId: number) {
    const request = await this.prisma.supervisorChangeRequest.findUnique({ where: { id: requestId }, include: { examSupervisor: { include: { examScheduleRoom: { include: { examSchedule: true } } } } } });
    if (!request || request.status !== 'PENDING') throw new NotFoundException('Không tìm thấy yêu cầu đổi ca đang chờ duyệt.');
    const schedule = request.examSupervisor.examScheduleRoom.examSchedule;
    const [teachers, busy, unavailable] = await Promise.all([
      this.prisma.teacher.findMany({ where: { id: { not: request.requesterTeacherId }, user: { status: 'ACTIVE' } }, orderBy: { teacherCode: 'asc' } }),
      this.prisma.examSupervisor.findMany({ where: { examScheduleRoom: { examSchedule: { id: { not: schedule.id }, status: { not: 'CANCELLED' }, deletedAt: null, examDate: schedule.examDate, startTime: { lt: schedule.endTime }, endTime: { gt: schedule.startTime } } } }, select: { teacherId: true } }),
      this.prisma.teacherDutyAvailability.findMany({ where: { examDate: schedule.examDate, startTime: { lt: schedule.endTime }, endTime: { gt: schedule.startTime }, status: 'UNAVAILABLE' }, select: { teacherId: true } }),
    ]);
    const blocked = new Set([...busy.map((item) => item.teacherId), ...unavailable.map((item) => item.teacherId)]);
    return teachers.filter((teacher) => !blocked.has(teacher.id));
  }

  async approveSupervisorChange(actor: { id: number }, requestId: number, replacementTeacherId?: number, reviewNote?: string) {
    if (!replacementTeacherId) throw new BadRequestException('Phải chọn giảng viên thay thế trước khi duyệt đổi ca.');
    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.supervisorChangeRequest.findUnique({
        where: { id: requestId },
        include: {
          requesterTeacher: true,
          examSupervisor: {
            include: {
              examScheduleRoom: {
                include: { room: true, examSchedule: { include: { subject: true } } },
              },
            },
          },
        },
      });
      if (!request || request.status !== 'PENDING') throw new BadRequestException('Yêu cầu đổi ca không còn ở trạng thái chờ duyệt.');
      const replacement = await tx.teacher.findUnique({ where: { id: replacementTeacherId }, include: { user: true } });
      if (!replacement || replacement.user.status !== 'ACTIVE') throw new BadRequestException('Giảng viên thay thế không khả dụng.');
      if (replacement.id === request.requesterTeacherId) throw new BadRequestException('Giảng viên thay thế phải khác người xin đổi ca.');
      const schedule = request.examSupervisor.examScheduleRoom.examSchedule;
      const [overlap, unavailable] = await Promise.all([
        tx.examSupervisor.findFirst({ where: { teacherId: replacement.id, id: { not: request.examSupervisorId }, examScheduleRoom: { examSchedule: { status: { not: 'CANCELLED' }, deletedAt: null, examDate: schedule.examDate, startTime: { lt: schedule.endTime }, endTime: { gt: schedule.startTime } } } } }),
        tx.teacherDutyAvailability.findFirst({ where: { teacherId: replacement.id, examDate: schedule.examDate, startTime: { lt: schedule.endTime }, endTime: { gt: schedule.startTime }, status: 'UNAVAILABLE' } }),
      ]);
      if (overlap || unavailable) throw new ConflictException('Giảng viên thay thế đang bận hoặc đã báo không thể coi thi trong khung giờ này.');
      await tx.examSupervisor.update({ where: { id: request.examSupervisorId }, data: { teacherId: replacement.id, status: 'PENDING', note: `Thay ca từ ${request.requesterTeacher.fullName}${reviewNote ? ` — ${reviewNote}` : ''}` } });
      const updatedRequest = await tx.supervisorChangeRequest.update({ where: { id: request.id }, data: { status: 'APPROVED', replacementTeacherId, reviewedById: actor.id, reviewNote, reviewedAt: new Date() } });
      await this.audit.write({ actorId: actor.id, action: 'APPROVE_CHANGE', entityType: 'EXAM_SUPERVISOR', entityId: request.examSupervisorId, description: `Đã duyệt đổi ca ${request.requesterTeacher.fullName} sang ${replacement.fullName} tại phòng ${request.examSupervisor.examScheduleRoom.room.roomCode}.`, metadata: { requestId, replacementTeacherId } }, tx);
      return { request: updatedRequest, oldTeacherUserId: request.requesterTeacher.userId, replacementUserId: replacement.userId, subjectName: schedule.subject.subjectName, roomCode: request.examSupervisor.examScheduleRoom.room.roomCode };
    });
    await this.notifications.createBulk([
      { userId: result.oldTeacherUserId, type: NotificationTypeDto.ASSIGNMENT_UPDATE, title: 'Yêu cầu đổi ca đã được duyệt', message: `Ca coi thi môn ${result.subjectName} tại phòng ${result.roomCode} đã được bàn giao.`, link: '/teacher/assignments', metadata: { requestId } },
      { userId: result.replacementUserId, type: NotificationTypeDto.ASSIGNMENT_UPDATE, title: 'Bạn được phân công coi thi thay thế', message: `Vui lòng xác nhận ca coi thi môn ${result.subjectName} tại phòng ${result.roomCode}.`, link: '/teacher/assignments', metadata: { requestId } },
    ]);
    return result.request;
  }

  async rejectSupervisorChange(actor: { id: number }, requestId: number, reviewNote?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.supervisorChangeRequest.findUnique({ where: { id: requestId }, include: { requesterTeacher: true } });
      if (!request || request.status !== 'PENDING') throw new BadRequestException('Yêu cầu đổi ca không còn ở trạng thái chờ duyệt.');
      await tx.examSupervisor.update({ where: { id: request.examSupervisorId }, data: { status: 'CONFIRMED' } });
      const updated = await tx.supervisorChangeRequest.update({ where: { id: requestId }, data: { status: 'REJECTED', reviewedById: actor.id, reviewNote, reviewedAt: new Date() } });
      await this.audit.write({ actorId: actor.id, action: 'REJECT_CHANGE', entityType: 'EXAM_SUPERVISOR', entityId: request.examSupervisorId, description: 'Đã từ chối yêu cầu đổi ca coi thi.', metadata: { requestId, reviewNote } }, tx);
      return { updated, userId: request.requesterTeacher.userId };
    });
    await this.notifications.create({ userId: result.userId, type: NotificationTypeDto.ASSIGNMENT_UPDATE, title: 'Yêu cầu đổi ca chưa được duyệt', message: reviewNote || 'Quản trị viên đã từ chối yêu cầu đổi ca. Vui lòng thực hiện ca đã xác nhận.', link: '/teacher/assignments', metadata: { requestId } });
    return result.updated;
  }

  async updateMyDutyAvailability(userId: number, data: { examDate: string; startTime: string; endTime: string; status: 'AVAILABLE' | 'UNAVAILABLE'; note?: string }) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Không tìm thấy thông tin giảng viên.');
    const examDate = new Date(data.examDate);
    if (Number.isNaN(examDate.getTime()) || data.startTime >= data.endTime) throw new BadRequestException('Ngày hoặc khung giờ đăng ký không hợp lệ.');
    return this.prisma.teacherDutyAvailability.upsert({
      where: { teacherId_examDate_startTime_endTime: { teacherId: teacher.id, examDate, startTime: data.startTime, endTime: data.endTime } },
      create: { teacherId: teacher.id, examDate, startTime: data.startTime, endTime: data.endTime, status: data.status, note: data.note },
      update: { status: data.status, note: data.note },
    });
  }

  async getAttendanceSheet(userId: number, assignmentId: number) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Không tìm thấy giảng viên.');

    const supervisor: any = await this.prisma.examSupervisor.findFirst({
      where: { id: assignmentId, teacherId: teacher.id },
      include: {
        examScheduleRoom: {
          include: {
            room: true,
            examSchedule: {
              include: {
                subject: true,
                examPeriod: true,
              },
            },
            examRoomStudents: {
              include: {
                  student: {
                  include: { class: true, user: { select: { id: true, username: true, email: true, role: true, status: true } } },
                },
              },
              orderBy: { seatNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!supervisor) {
      throw new NotFoundException('Không tìm thấy phân công coi thi.');
    }

    const room = supervisor.examScheduleRoom;
    const schedule = room.examSchedule;

    return {
      assignmentId,
      role: supervisor.role,
      status: supervisor.status,
      room: {
        roomCode: room.room.roomCode,
        roomName: room.room.roomName,
        building: room.room.building,
        capacity: room.room.capacity,
      },
      schedule: {
        subjectName: schedule.subject.subjectName,
        subjectCode: schedule.subject.subjectCode,
        periodName: schedule.examPeriod.name,
        examDate: schedule.examDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      },
      students: (room.examRoomStudents || []).map((rs: any) => ({
        seatNumber: rs.seatNumber,
        examNumber: rs.examNumber,
        studentCode: rs.student.studentCode,
        fullName: rs.student.fullName || rs.student.user?.username || 'Sinh viên',
        className: rs.student.class?.name || 'Chưa phân lớp',
      })),
    };
  }
}
