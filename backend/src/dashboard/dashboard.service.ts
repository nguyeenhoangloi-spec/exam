import { Injectable } from '@nestjs/common';
import { QuestionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const QUESTION_STATUSES: QuestionStatus[] = [
  QuestionStatus.DRAFT,
  QuestionStatus.PENDING,
  QuestionStatus.APPROVED,
  QuestionStatus.REJECTED,
  QuestionStatus.ARCHIVED,
];

type MonthlyCount = { month: Date; count: bigint };

@Injectable()
export class DashboardService {
  private overviewCache: { data: any; timestamp: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private vietnamParts(date = new Date()) {
    const local = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const year = local.getUTCFullYear();
    const month = local.getUTCMonth();
    const day = local.getUTCDate();
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const timeKey = `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`;
    return { year, month, day, dateKey, timeKey };
  }

  private scheduleStatus(
    storedStatus: string,
    examDate: Date,
    startTime: string,
    endTime: string,
    current: ReturnType<DashboardService['vietnamParts']>,
  ) {
    if (storedStatus === 'CANCELLED') return 'CANCELLED';
    if (storedStatus === 'COMPLETED') return 'COMPLETED';
    const examKey = examDate.toISOString().slice(0, 10);
    if (examKey < current.dateKey || (examKey === current.dateKey && endTime < current.timeKey)) return 'COMPLETED';
    if (examKey === current.dateKey && startTime <= current.timeKey && endTime >= current.timeKey) return 'ONGOING';
    return 'UPCOMING';
  }

  private percent(value: number, total: number) {
    return total ? Math.round((value / total) * 100) : 0;
  }

  async overview() {
    const nowTimestamp = Date.now();
    if (this.overviewCache && nowTimestamp - this.overviewCache.timestamp < 3000) {
      return this.overviewCache.data;
    }

    const now = new Date();
    const current = this.vietnamParts(now);
    const todayStart = new Date(`${current.dateKey}T00:00:00.000Z`);
    const todayEnd = new Date(`${current.dateKey}T23:59:59.999Z`);
    const chartStart = new Date(Date.UTC(current.year, current.month - 5, 1));
    const chartEnd = new Date(Date.UTC(current.year, current.month + 1, 1));
    const upcomingWhere = {
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
      OR: [
        { examDate: { gt: todayEnd } },
        { examDate: { gte: todayStart, lte: todayEnd }, endTime: { gte: current.timeKey } },
      ],
    };

    const [
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalRooms,
      totalClasses,
      availableRooms,
      upcomingCount,
      pendingCount,
      todayExamCount,
      monthlyCounts,
      questionGroups,
      upcomingRows,
      pendingRows,
      progressPeriods,
      recentRows,
      unassignedSchedules,
      missingSupervisorRooms,
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.teacher.count({ where: { user: { status: 'ACTIVE' } } }),
      this.prisma.subject.count(),
      this.prisma.examRoom.count(),
      this.prisma.class.count(),
      this.prisma.examRoom.count({ where: { status: 'AVAILABLE' } }),
      this.prisma.examSchedule.count({
        where: upcomingWhere,
      }),
      this.prisma.question.count({ where: { status: QuestionStatus.PENDING, deletedAt: null } }),
      this.prisma.examSchedule.count({
        where: { examDate: { gte: todayStart, lte: todayEnd }, status: { notIn: ['CANCELLED', 'COMPLETED'] }, deletedAt: null },
      }),
      this.prisma.$queryRaw<MonthlyCount[]>`
        SELECT date_trunc('month', "examDate") AS month, COUNT(*)::bigint AS count
        FROM "exam_schedules"
        WHERE "examDate" >= ${chartStart} AND "examDate" < ${chartEnd}
          AND "status" <> 'CANCELLED'
          AND "deletedAt" IS NULL
        GROUP BY date_trunc('month', "examDate")
        ORDER BY month ASC
      `,
      this.prisma.question.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.examSchedule.findMany({
        where: { ...upcomingWhere, deletedAt: null },
        take: 5,
        orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
        include: {
          examPeriod: { select: { name: true } },
          subject: { select: { subjectCode: true, subjectName: true } },
          examScheduleRooms: {
            select: {
              room: { select: { roomCode: true } },
              _count: { select: { examRoomStudents: true } },
            },
          },
        },
      }),
      this.prisma.question.findMany({
        where: { status: QuestionStatus.PENDING, deletedAt: null },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          code: true,
          content: true,
          difficulty: true,
          updatedAt: true,
          createdById: true,
          subject: { select: { subjectCode: true, subjectName: true } },
          chapter: { select: { code: true, name: true } },
          createdBy: { select: { id: true, username: true, role: true } },
        },
      }),
      this.prisma.examPeriod.findMany({
        where: { status: { in: ['UPCOMING', 'ONGOING'] } },
        take: 4,
        orderBy: { startDate: 'asc' },
        include: {
          examSchedules: {
            where: { status: { not: 'CANCELLED' }, deletedAt: null },
            select: {
              id: true,
              examScheduleRooms: {
                select: {
                  _count: { select: { examRoomStudents: true, supervisors: true } },
                },
              },
              _count: {
                select: {
                  examPapers: {
                    where: {
                      deletedAt: null,
                      status: { not: 'ARCHIVED' },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, username: true } } },
      }),
      this.prisma.examSchedule.count({
        where: {
          deletedAt: null,
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
          examScheduleRooms: { none: {} },
        },
      }),
      this.prisma.examScheduleRoom.count({
        where: {
          examSchedule: {
            deletedAt: null,
            status: { notIn: ['CANCELLED', 'COMPLETED'] },
          },
          supervisors: { none: {} },
        },
      }),
    ]);

    const countByMonth = new Map(
      monthlyCounts.map((item) => [item.month.toISOString().slice(0, 7), Number(item.count)]),
    );
    const examChart = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(current.year, current.month - 5 + index, 1));
      const key = date.toISOString().slice(0, 7);
      return { key, label: `T${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`, count: countByMonth.get(key) || 0 };
    });

    const groupedStatuses = new Map(questionGroups.map((item) => [item.status, item._count._all]));
    const questionStatus = QUESTION_STATUSES.map((status) => ({
      status,
      count: groupedStatuses.get(status) || 0,
    }));

    const upcomingExams = upcomingRows.map((schedule) => ({
      id: schedule.id,
      periodName: schedule.examPeriod.name,
      subjectCode: schedule.subject.subjectCode,
      subjectName: schedule.subject.subjectName,
      examDate: schedule.examDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      roomCodes: schedule.examScheduleRooms.map((item) => item.room.roomCode),
      studentCount: schedule.examScheduleRooms.reduce(
        (sum, item) => sum + item._count.examRoomStudents,
        0,
      ),
      status: this.scheduleStatus(
        schedule.status,
        schedule.examDate,
        schedule.startTime,
        schedule.endTime,
        current,
      ),
    }));

    const examProgress = progressPeriods.map((period) => {
      const schedules = period.examSchedules;
      const totalSchedules = schedules.length;
      const arrangedSchedules = schedules.filter((schedule) => schedule.examScheduleRooms.length > 0).length;
      const rooms = schedules.flatMap((schedule) => schedule.examScheduleRooms);
      const supervisedSchedules = schedules.filter(
        (schedule) =>
          schedule.examScheduleRooms.length > 0 &&
          schedule.examScheduleRooms.every((room) => room._count.supervisors > 0),
      ).length;
      const paperSchedules = schedules.filter((schedule) => schedule._count.examPapers > 0).length;
      const incompleteSchedules = schedules.filter(
        (schedule) =>
          !schedule.examScheduleRooms.length ||
          schedule.examScheduleRooms.some((room) => room._count.supervisors === 0) ||
          schedule._count.examPapers === 0,
      ).length;
      return {
        id: period.id,
        name: period.name,
        status: period.status,
        startDate: period.startDate,
        endDate: period.endDate,
        totalSchedules,
        arrangedSchedules,
        supervisedSchedules,
        completedSchedules: totalSchedules - incompleteSchedules,
        roomProgress: this.percent(arrangedSchedules, totalSchedules),
        supervisorProgress: this.percent(supervisedSchedules, totalSchedules),
        paperProgress: this.percent(paperSchedules, totalSchedules),
        incompleteSchedules,
      };
    });

    const result = {
      attention: {
        unassignedRooms: unassignedSchedules,
        missingSupervisors: missingSupervisorRooms,
        pendingQuestions: pendingCount,
        upcomingExams: upcomingCount,
      },
      summary: {
        students: {
          total: totalStudents,
          description: totalClasses ? `Thuộc ${totalClasses} lớp học` : 'Đang cập nhật',
          route: '/students',
        },
        lecturers: {
          total: totalTeachers,
          description: `${totalTeachers} tài khoản đang hoạt động`,
          route: '/teachers',
        },
        subjects: {
          total: totalSubjects,
          description: totalSubjects ? 'Đang được quản lý' : 'Đang cập nhật',
          route: '/subjects',
        },
        examRooms: {
          total: totalRooms,
          description: `${availableRooms} phòng sẵn sàng`,
          route: '/exam-rooms',
        },
        upcomingExams: {
          total: upcomingCount,
          description: todayExamCount ? `${todayExamCount} lịch thi hôm nay` : 'Không có lịch thi hôm nay',
          route: '/exam-schedules',
        },
        pendingQuestions: {
          total: pendingCount,
          description: pendingCount ? `${pendingCount} câu cần xử lý` : 'Không có câu chờ xử lý',
          route: '/question-bank?status=PENDING',
        },
      },
      today: { examCount: todayExamCount, pendingQuestionCount: pendingCount },
      examChart,
      questionStatus,
      upcomingExams,
      pendingQuestions: pendingRows.map((question) => ({
        ...question,
        submittedAt: question.updatedAt,
      })),
      examProgress,
      recentActivities: recentRows.map((activity) => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        description: activity.description,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
        actor: activity.actor,
      })),
      generatedAt: now,
    };

    this.overviewCache = { data: result, timestamp: nowTimestamp };
    return result;
  }
}
