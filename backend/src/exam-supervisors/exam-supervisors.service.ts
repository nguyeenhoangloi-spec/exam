import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExamSupervisorsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async assign(actor: { id: number }, data: { examScheduleRoomId: number; teacherId: number; role?: string; note?: string }) {
    // 1. Kiểm tra giảng viên tồn tại
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: data.teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Giảng viên không tồn tại.');
    }

    // 2. Kiểm tra examScheduleRoom tồn tại
    const scheduleRoom = await this.prisma.examScheduleRoom.findUnique({
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

    // 3. Kiểm tra không phân công trùng giảng viên trong cùng một phòng
    const alreadyInRoom = scheduleRoom.supervisors.some((s) => s.teacherId === data.teacherId);
    if (alreadyInRoom) {
      throw new BadRequestException(`Giảng viên ${teacher.fullName} đã được phân công coi thi ở phòng này.`);
    }

    // 4. Kiểm tra phòng không quá 2 giám thị
    if (scheduleRoom.supervisors.length >= 2) {
      throw new BadRequestException('Mỗi phòng thi không được phân công quá 2 giám thị.');
    }

    // 5. Kiểm tra giảng viên không bị trùng lịch coi thi ở phòng khác cùng thời gian
    const conflictingSupervisors = await this.prisma.examSupervisor.findMany({
      where: {
        teacherId: data.teacherId,
        examScheduleRoom: {
          examSchedule: {
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

    return this.prisma.$transaction(async (tx) => {
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
    });
  }

  async remove(id: number) {
    const supervisor = await this.prisma.examSupervisor.findUnique({ where: { id } });
    if (!supervisor) throw new NotFoundException('Không tìm thấy bản ghi phân công giám thị.');

    return this.prisma.examSupervisor.delete({ where: { id } });
  }

  async getSupervisorsBySchedule(examScheduleId: number) {
    return this.prisma.examSupervisor.findMany({
      where: {
        examScheduleRoom: {
          examScheduleId,
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
