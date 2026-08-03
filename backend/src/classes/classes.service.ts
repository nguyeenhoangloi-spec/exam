import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.class.findMany({
      include: {
        department: true,
        _count: { select: { students: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: number) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
      include: { department: true, students: true },
    });
    if (!cls) throw new NotFoundException('Không tìm thấy lớp học.');
    return cls;
  }

  async create(data: { code: string; name: string; departmentId: number }) {
    return this.prisma.class.create({ data });
  }

  async update(id: number, data: { code?: string; name?: string; departmentId?: number }) {
    await this.findOne(id);
    return this.prisma.class.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.class.delete({ where: { id } });
  }
}
