import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ExamRoomsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async setLock(actor: { id: number }, id: number, locked: boolean) {
    const room = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.examRoom.update({ where: { id }, data: { status: locked ? 'LOCKED' : 'AVAILABLE' } });
      await this.audit.write({ actorId: actor.id, action: locked ? 'LOCK' : 'UNLOCK', entityType: 'EXAM_ROOM', entityId: id, description: `${locked ? 'Đã khóa' : 'Đã mở khóa'} phòng ${room.roomCode}` }, tx);
      return updated;
    });
  }

  async findAll() {
    return this.prisma.examRoom.findMany({
      orderBy: { roomCode: 'asc' },
    });
  }

  async findOne(id: number) {
    const room = await this.prisma.examRoom.findUnique({
      where: { id },
    });
    if (!room) throw new NotFoundException('Không tìm thấy phòng thi.');
    return room;
  }

  async create(data: {
    roomCode: string;
    roomName: string;
    building: string;
    capacity: number;
    roomType?: string;
    status?: string;
  }) {
    const existing = await this.prisma.examRoom.findUnique({
      where: { roomCode: data.roomCode },
    });
    if (existing) throw new BadRequestException('Mã phòng thi đã tồn tại.');

    return this.prisma.examRoom.create({ data });
  }

  async update(id: number, data: any, allowUnlock = false) {
    const room = await this.findOne(id);
    if (room.status === 'LOCKED' && !allowUnlock) {
      throw new BadRequestException('Phòng thi đã khóa, chỉ được mở khóa trước khi thay đổi.');
    }
    if (data.capacity !== undefined) {
      if (!Number.isInteger(data.capacity) || data.capacity < 1) {
        throw new BadRequestException('Sức chứa phòng phải là số nguyên dương.');
      }
      const assignments = await this.prisma.examScheduleRoom.findMany({
        where: { roomId: id },
        select: { _count: { select: { examRoomStudents: true } } },
      });
      const maxAssigned = Math.max(0, ...assignments.map((assignment) => assignment._count.examRoomStudents));
      if (maxAssigned > data.capacity) {
        throw new BadRequestException('Không thể giảm sức chứa thấp hơn số sinh viên đã được xếp trong một ca thi.');
      }
    }
    if (data.status && data.status !== 'AVAILABLE') {
      const activeAssignment = await this.prisma.examScheduleRoom.findFirst({
        where: { roomId: id, examSchedule: { status: { in: ['SCHEDULED', 'ONGOING'] } } },
      });
      if (activeAssignment) {
        throw new BadRequestException(`Không thể đổi trạng thái phòng ${room.roomCode} khi còn lịch thi đang hoạt động.`);
      }
    }
    return this.prisma.examRoom.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const room = await this.findOne(id);
    const usage = await this.prisma.examScheduleRoom.count({ where: { roomId: id } });
    if (usage > 0) {
      throw new BadRequestException(`Không thể xóa phòng ${room.roomCode} vì phòng đã được dùng trong lịch thi.`);
    }
    return this.prisma.examRoom.delete({ where: { id } });
  }
}
