import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalStudents, totalTeachers, totalSubjects, totalExamSchedules, totalExamRooms, pendingQuestions] =
      await Promise.all([
        this.prisma.student.count(),
        this.prisma.teacher.count(),
        this.prisma.subject.count(),
        this.prisma.examSchedule.count(),
        this.prisma.examRoom.count(),
        this.prisma.question.count({ where: { status: 'PENDING' } }),
      ]);

    return {
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalExamSchedules,
      totalExamRooms,
      pendingQuestions,
    };
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        student: true,
        teacher: true,
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');
    return user;
  }
}
