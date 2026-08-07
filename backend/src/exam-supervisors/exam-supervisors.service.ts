import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateSupervisorStatusDto } from './dto/exam-supervisor.dto';

@Injectable()
export class ExamSupervisorsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async previewAutoAssign(examScheduleId: number) {
    const schedule = await this.prisma.examSchedule.findFirst({
      where: { id: examScheduleId, deletedAt: null },
      include: { subject: true, examPapers: { where: { deletedAt: null }, select: { status: true } }, examScheduleRooms: { include: { room: true, supervisors: true } } },
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch thi.');
    if (['CANCELLED', 'COMPLETED', 'LOCKED'].includes(schedule.status)) throw new BadRequestException('Không thể đề xuất giám thị cho lịch đã hủy, hoàn thành hoặc đã khóa.');
    if (schedule.examPapers.some((paper) => paper.status === 'PUBLISHED')) throw new BadRequestException('Lịch thi đã có đề công bố, không được thay đổi phân công.');
    const teachers = await this.prisma.teacher.findMany({
      where: { user: { status: 'ACTIVE' } },
      include: { user: { select: { status: true } } },
      orderBy: { teacherCode: 'asc' },
    });
    const busy = await this.prisma.examSupervisor.findMany({
      where: { examScheduleRoom: { examSchedule: { status: { not: 'CANCELLED' }, deletedAt: null, examDate: schedule.examDate, startTime: { lt: schedule.endTime }, endTime: { gt: schedule.startTime } } } },
      select: { teacherId: true },
    });
    const loads = await this.prisma.examSupervisor.groupBy({ by: ['teacherId'], _count: { _all: true } });
    const teacherLoad = new Map(loads.map((item) => [item.teacherId, item._count._all]));
    teachers.sort((a, b) => (teacherLoad.get(a.id) || 0) - (teacherLoad.get(b.id) || 0));
    const busyTeachers = new Set(busy.map((item) => item.teacherId));
    const usedInProposal = new Set<number>();
    const proposals: Array<{ examScheduleRoomId: number; teacherId: number; teacherName: string; roomCode: string; role: string }> = [];
    const unassigned: Array<{ examScheduleRoomId: number; roomCode: string; reason: string }> = [];
    for (const room of schedule.examScheduleRooms) {
      const existingRoles = new Set(room.supervisors.map((item) => item.role));
      for (const role of ['SUPERVISOR_1', 'SUPERVISOR_2'] as const) {
        if (existingRoles.has(role)) continue;
        const teacher = teachers.find((candidate) => !busyTeachers.has(candidate.id) && !usedInProposal.has(candidate.id));
        if (!teacher) {
          unassigned.push({ examScheduleRoomId: room.id, roomCode: room.room.roomCode, reason: 'Không còn giảng viên rảnh trong khung giờ.' });
          continue;
        }
        usedInProposal.add(teacher.id);
        proposals.push({ examScheduleRoomId: room.id, teacherId: teacher.id, teacherName: teacher.fullName, roomCode: room.room.roomCode, role });
      }
    }
    const warnings = unassigned.length ? ['Một số phòng chưa đủ giám thị.'] : [];
    return {
      preview: true,
      schedule: { id: schedule.id, subject: schedule.subject.subjectName, examDate: schedule.examDate, startTime: schedule.startTime, endTime: schedule.endTime },
      score: Math.max(0, 100 - unassigned.length * 20),
      isValid: unassigned.length === 0,
      proposals,
      errors: [],
      warnings,
      unassigned,
      alternatives: unassigned.length ? [{ rationale: 'Mở thêm giảng viên rảnh hoặc đổi khung giờ thi.' }] : [{ rationale: 'Có thể chạy lại preview để cân bằng thứ tự giám thị.' }],
      rationale: 'Chọn giảng viên đang hoạt động, không trùng lịch và cân bằng theo mã giảng viên.',
    };
  }

  async acceptAutoAssign(actor: { id: number }, proposals: Array<{ examScheduleRoomId: number; teacherId: number; role: string }>) {
    if (!proposals?.length) throw new BadRequestException('Phương án không có phân công nào để lưu.');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const created: any[] = [];
        const proposalTeachers = new Set<number>();
        for (const proposal of proposals) {
          if (proposalTeachers.has(proposal.teacherId)) throw new ConflictException('Một giảng viên không thể được đề xuất cho hai phòng trong cùng phương án.');
          proposalTeachers.add(proposal.teacherId);
          const room = await tx.examScheduleRoom.findUnique({ where: { id: proposal.examScheduleRoomId }, include: { examSchedule: { include: { examPapers: { where: { deletedAt: null }, select: { status: true } } } }, room: true, supervisors: true } });
          const teacher = await tx.teacher.findUnique({ where: { id: proposal.teacherId }, include: { user: { select: { status: true } } } });
          if (!room || !teacher) throw new NotFoundException('Phòng thi hoặc giảng viên trong phương án không còn tồn tại.');
          if (['CANCELLED', 'COMPLETED', 'LOCKED'].includes(room.examSchedule.status)) throw new BadRequestException('Không thể lưu phân công cho lịch đã hủy, hoàn thành hoặc đã khóa.');
          if (room.examSchedule.examPapers.some((paper) => paper.status === 'PUBLISHED')) throw new BadRequestException('Lịch thi đã có đề công bố, không được thay đổi phân công.');
          if (teacher.user.status !== 'ACTIVE' || room.supervisors.length >= 2 || room.supervisors.some((item) => item.role === proposal.role || item.teacherId === proposal.teacherId)) {
            throw new ConflictException(`Phương án phân công phòng ${room.room.roomCode} không còn hợp lệ.`);
          }
          const overlap = await tx.examSupervisor.findFirst({ where: { teacherId: proposal.teacherId, examScheduleRoom: { examSchedule: { id: { not: room.examScheduleId }, status: { not: 'CANCELLED' }, deletedAt: null, examDate: room.examSchedule.examDate, startTime: { lt: room.examSchedule.endTime }, endTime: { gt: room.examSchedule.startTime } } } } });
          if (overlap) throw new ConflictException(`Giảng viên ${teacher.fullName} vừa bị trùng lịch coi thi.`);
          const assignment = await tx.examSupervisor.create({ data: { examScheduleRoomId: room.id, teacherId: teacher.id, role: proposal.role }, include: { teacher: true, examScheduleRoom: { include: { room: true } } } });
          created.push(assignment);
          await this.audit.write({ actorId: actor.id, action: 'AUTO_ASSIGN', entityType: 'EXAM_SUPERVISOR', entityId: assignment.id, description: `Đã lưu phân công tự động ${teacher.fullName} tại phòng ${room.room.roomCode}`, metadata: { proposal } }, tx);
        }
        return { successCount: created.length, failedCount: 0, data: created };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: any) {
      if (error?.code === 'P2034') throw new ConflictException('Dữ liệu phân công vừa thay đổi. Vui lòng xem lại phương án.');
      throw error;
    }
  }

  async assign(actor: { id: number }, data: { examScheduleRoomId: number; teacherId: number; role?: string; note?: string }) {
    try {
    return await this.prisma.$transaction(async (tx) => {
    // 1. Kiểm tra giảng viên tồn tại
    const teacher = await tx.teacher.findUnique({
      where: { id: data.teacherId },
      include: { user: { select: { status: true } } },
    });
    if (!teacher) {
      throw new NotFoundException('Giảng viên không tồn tại.');
    }
    if (teacher.user.status !== 'ACTIVE') {
      throw new BadRequestException('Không thể phân công giảng viên đang không hoạt động.');
    }

    // 2. Kiểm tra examScheduleRoom tồn tại
    const scheduleRoom = await tx.examScheduleRoom.findUnique({
      where: { id: data.examScheduleRoomId },
      include: {
        room: true,
        examSchedule: { include: { examPapers: { where: { deletedAt: null }, select: { status: true } } } },
        supervisors: true,
      },
    });
    if (!scheduleRoom) {
      throw new NotFoundException('Phòng thi của lịch thi không tồn tại.');
    }
    if (['CANCELLED', 'COMPLETED', 'LOCKED'].includes(scheduleRoom.examSchedule.status)) {
      throw new BadRequestException('Không thể phân công giám thị cho lịch thi đã hủy hoặc hoàn thành.');
    }
    if (scheduleRoom.examSchedule.deletedAt) throw new NotFoundException('Lịch thi đã nằm trong thùng rác.');
    if (scheduleRoom.examSchedule.examPapers.some((paper) => paper.status === 'PUBLISHED')) {
      throw new BadRequestException('Lịch thi đã có đề công bố, không được thay đổi phân công.');
    }

    // 3. Kiểm tra không phân công trùng giảng viên trong cùng một phòng
    const alreadyInRoom = scheduleRoom.supervisors.some((s) => s.teacherId === data.teacherId);
    if (alreadyInRoom) {
      throw new BadRequestException(`Giảng viên ${teacher.fullName} đã được phân công coi thi ở phòng này.`);
    }
    if (data.role && scheduleRoom.supervisors.some((supervisor) => supervisor.role === data.role)) {
      throw new BadRequestException(`Phòng thi đã có ${data.role === 'SUPERVISOR_1' ? 'giám thị 1' : 'giám thị 2'}.`);
    }

    // 4. Kiểm tra phòng không quá 2 giám thị
    if (scheduleRoom.supervisors.length >= 2) {
      throw new BadRequestException('Mỗi phòng thi không được phân công quá 2 giám thị.');
    }

    // 5. Kiểm tra giảng viên không bị trùng lịch coi thi ở phòng khác cùng thời gian
    const conflictingSupervisors = await tx.examSupervisor.findMany({
      where: {
        teacherId: data.teacherId,
        examScheduleRoom: {
          examSchedule: {
            status: { not: 'CANCELLED' },
            deletedAt: null,
            examDate: scheduleRoom.examSchedule.examDate,
            AND: [
              { startTime: { lt: scheduleRoom.examSchedule.endTime } },
              { endTime: { gt: scheduleRoom.examSchedule.startTime } },
            ],
          },
        },
      },
      include: {
        examScheduleRoom: {
          include: { room: true },
        },
      },
    });

    if (conflictingSupervisors.length > 0) {
      const conflictRoom = conflictingSupervisors[0].examScheduleRoom.room.roomCode;
      throw new BadRequestException(
        `Giảng viên ${teacher.fullName} đã có lịch coi thi tại phòng ${conflictRoom} trong cùng khung giờ (${scheduleRoom.examSchedule.startTime} - ${scheduleRoom.examSchedule.endTime}).`,
      );
    }

      const assignment = await tx.examSupervisor.create({ data: {
        examScheduleRoomId: data.examScheduleRoomId,
        teacherId: data.teacherId,
        role: data.role || 'SUPERVISOR_1',
        note: data.note,
        status: 'PENDING',
      }, include: {
        teacher: true,
        examScheduleRoom: {
          include: { room: true, examSchedule: { include: { subject: true } } },
        },
      } });
      await this.audit.write({
        actorId: actor.id,
        action: 'ASSIGN',
        entityType: 'EXAM_SUPERVISOR',
        entityId: assignment.id,
        description: `Đã phân công giám thị ${assignment.teacher.fullName} tại phòng ${assignment.examScheduleRoom.room.roomCode}`,
        metadata: { examScheduleRoomId: data.examScheduleRoomId, teacherId: data.teacherId },
      }, tx);
      return assignment;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: any) {
      if (error?.code === 'P2034') {
        throw new ConflictException('Dữ liệu phân công vừa thay đổi bởi thao tác khác. Vui lòng tải lại và thử lại.');
      }
      throw error;
    }
  }

  async remove(actor: { id: number }, id: number) {
    const supervisor = await this.prisma.examSupervisor.findUnique({
      where: { id },
      include: { teacher: true, examScheduleRoom: { include: { room: true, examSchedule: { include: { examPapers: { where: { deletedAt: null }, select: { status: true } } } } } } },
    });
    if (!supervisor) throw new NotFoundException('Không tìm thấy bản ghi phân công giám thị.');
    if (['LOCKED', 'COMPLETED'].includes(supervisor.examScheduleRoom.examSchedule.status) || supervisor.examScheduleRoom.examSchedule.examPapers.some((paper) => paper.status === 'PUBLISHED')) {
      throw new BadRequestException('Không thể hủy phân công của lịch đã khóa, hoàn thành hoặc đã công bố đề.');
    }

    return this.prisma.$transaction(async (tx) => {
      const removed = await tx.examSupervisor.delete({ where: { id } });
      await this.audit.write({
        actorId: actor.id,
        action: 'DELETE',
        entityType: 'EXAM_SUPERVISOR',
        entityId: id,
        description: `Đã hủy phân công giám thị ${supervisor.teacher.fullName} tại phòng ${supervisor.examScheduleRoom.room.roomCode}`,
        metadata: { examScheduleRoomId: supervisor.examScheduleRoomId, teacherId: supervisor.teacherId },
      }, tx);
      return removed;
    });
  }

  async updateSupervisorStatus(actor: { id: number }, id: number, dto: UpdateSupervisorStatusDto) {
    const supervisor = await this.prisma.examSupervisor.findUnique({
      where: { id },
      include: { teacher: true, examScheduleRoom: { include: { room: true } } },
    });
    if (!supervisor) throw new NotFoundException('Không tìm thấy bản ghi phân công giám thị.');

    if (dto.status === 'CHANGE_APPROVED') {
      // Hủy phân công cũ để Admin gán giảng viên mới
      await this.prisma.examSupervisor.delete({ where: { id } });
      await this.audit.write({
        actorId: actor.id,
        action: 'APPROVE_CHANGE',
        entityType: 'EXAM_SUPERVISOR',
        entityId: id,
        description: `Admin đã chấp nhận yêu cầu đổi ca của ${supervisor.teacher.fullName} tại phòng ${supervisor.examScheduleRoom.room.roomCode} (đã gỡ gán cũ)`,
      });
      return { message: 'Đã chấp nhận đổi ca và gỡ phân công cũ thành công.' };
    }

    let targetStatus = dto.status;
    let note = dto.note ?? supervisor.note;
    if (dto.status === 'REJECTED') {
      targetStatus = 'CONFIRMED';
      note = `${supervisor.note || ''} (Admin từ chối yêu cầu đổi ca)`;
    }

    const updated = await this.prisma.examSupervisor.update({
      where: { id },
      data: {
        status: targetStatus,
        note: note,
      },
      include: {
        teacher: true,
        examScheduleRoom: {
          include: {
            room: true,
            examSchedule: { include: { subject: true, examPeriod: true } },
          },
        },
      },
    });

    await this.audit.write({
      actorId: actor.id,
      action: 'UPDATE_STATUS',
      entityType: 'EXAM_SUPERVISOR',
      entityId: id,
      description: `Cập nhật trạng thái phân công coi thi của ${supervisor.teacher.fullName} thành ${targetStatus}`,
    });

    return updated;
  }

  async getSupervisors(query: { examScheduleRoomId?: number; examScheduleId?: number; status?: string; teacherId?: number }) {
    return this.prisma.examSupervisor.findMany({
      where: {
        ...(query.teacherId ? { teacherId: query.teacherId } : {}),
        ...(query.status ? { status: query.status } : {}),
        examScheduleRoom: {
          ...(query.examScheduleRoomId ? { id: query.examScheduleRoomId } : {}),
          ...(query.examScheduleId ? { examScheduleId: query.examScheduleId } : {}),
          examSchedule: { deletedAt: null },
        },
      },
      include: {
        teacher: true,
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
      orderBy: { id: 'desc' },
    });
  }
}
