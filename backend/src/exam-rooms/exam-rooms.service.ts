import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamRoomsService {
  constructor(private prisma: PrismaService) {}

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

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.examRoom.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.examRoom.delete({ where: { id } });
  }
}
