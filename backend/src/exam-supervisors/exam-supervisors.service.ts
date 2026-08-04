import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExamSupervisorsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

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
        examSchedule: true,
        supervisors: true,
      },
    });
    if (!scheduleRoom) {
      throw new NotFoundException('Phòng thi của lịch thi không tồn tại.');
    }
    if (['CANCELLED', 'COMPLETED'].includes(scheduleRoom.examSchedule.status)) {
      throw new BadRequestException('Không thể phân công giám thị cho lịch thi đã hủy hoặc hoàn thành.');
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
      include: { teacher: true, examScheduleRoom: { include: { room: true } } },
    });
    if (!supervisor) throw new NotFoundException('Không tìm thấy bản ghi phân công giám thị.');

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

  async getSupervisors(query: { examScheduleRoomId?: number; examScheduleId?: number }) {
    return this.prisma.examSupervisor.findMany({
      where: {
        examScheduleRoom: {
          ...(query.examScheduleRoomId ? { id: query.examScheduleRoomId } : {}),
          ...(query.examScheduleId ? { examScheduleId: query.examScheduleId } : {}),
        },
      },
      include: {
        teacher: true,
        examScheduleRoom: {
          include: { room: true },
        },
      },
    });
  }
}
