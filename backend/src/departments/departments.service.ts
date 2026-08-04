import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        _count: {
          select: { classes: true, teachers: true, subjects: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { classes: true, teachers: true, subjects: true },
    });
    if (!department) throw new NotFoundException('Không tìm thấy khoa.');
    return department;
  }

  async create(data: { code: string; name: string }) {
    return this.prisma.department.create({ data });
  }

  async update(id: number, data: { code?: string; name?: string }) {
    await this.findOne(id);
    return this.prisma.department.update({ where: { id }, data });
  }

  async remove(id: number) {
    const department = await this.findOne(id);
    if (department.classes.length || department.teachers.length || department.subjects.length) {
      throw new BadRequestException('Không thể xóa khoa còn lớp học, giảng viên hoặc môn học.');
    }
    return this.prisma.department.delete({ where: { id } });
  }
}
