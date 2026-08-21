import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const submittedStatuses = ['SUBMITTED', 'AUTO_SUBMITTED', 'UNDER_REVIEW', 'GRADED'];

@Injectable()
export class ExamReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private officialScheduleWhere(actor: any) {
    const where: any = { deletedAt: null, mode: 'OFFICIAL' };
    if (actor?.role === 'TEACHER') {
      where.AND = [
        { examScheduleRooms: { some: { supervisors: { some: { teacher: { userId: actor.id } } } } } },
      ];
    }
    return where;
  }

  async getSchedules(actor: any) {
    return this.prisma.examSchedule.findMany({
      where: this.officialScheduleWhere(actor),
      include: {
        examPeriod: true,
        subject: true,
        examPapers: { where: { deletedAt: null }, select: { id: true, paperCode: true, status: true } },
        examScheduleRooms: { include: { room: true, _count: { select: { examRoomStudents: true, supervisors: true } } } },
      },
      orderBy: { examDate: 'asc' },
    });
  }

  async getSummary(actor: any, query: Record<string, string>) {
    const int = (value?: string) => (value && /^\d+$/.test(value) ? Number(value) : undefined);
    const examPeriodId = int(query.examPeriodId);
    const subjectId = int(query.subjectId);
    const departmentId = int(query.departmentId);
    const classId = int(query.classId);
    const fromDate = query.fromDate ? new Date(`${query.fromDate}T00:00:00.000Z`) : undefined;
    const toDate = query.toDate ? new Date(`${query.toDate}T23:59:59.999Z`) : undefined;

    // Báo cáo khảo thí chính thức không bao gồm dữ liệu luyện tập/thi thử.
    const scheduleWhere: any = this.officialScheduleWhere(actor);
    if (examPeriodId) scheduleWhere.examPeriodId = examPeriodId;
    if (subjectId) scheduleWhere.subjectId = subjectId;
    if (fromDate || toDate) scheduleWhere.examDate = { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) };
    if (departmentId) scheduleWhere.subject = { departmentId };
    if (classId) {
      scheduleWhere.AND = [
        ...(scheduleWhere.AND || []),
        { examScheduleRooms: { some: { examRoomStudents: { some: { student: { classId } } } } } },
      ];
    }
    const schedules: any[] = await this.prisma.examSchedule.findMany({
      where: scheduleWhere,
      select: {
        id: true,
        examPeriodId: true,
        examDate: true,
        subject: { select: { id: true, subjectCode: true, subjectName: true, departmentId: true, department: { select: { id: true, name: true } } } },
        examPeriod: { select: { id: true, name: true } },
        examScheduleRooms: { select: { examRoomStudents: { select: { studentId: true, student: { select: { classId: true, class: { select: { id: true, name: true } } } } } } } },
      },
      orderBy: { examDate: 'asc' },
    });

    const scheduleIds = schedules.map((schedule) => schedule.id);
    const attempts: any[] = scheduleIds.length
      ? await this.prisma.examAttempt.findMany({
        where: { mode: 'OFFICIAL', onlineExamConfig: { examScheduleId: { in: scheduleIds } } },
        select: { studentId: true, status: true, totalScore: true, submittedAt: true, gradingStatus: true, isFlagged: true, riskScore: true, incidents: { select: { id: true } }, onlineExamConfig: { select: { examScheduleId: true } } },
      })
      : [];

    const attemptsBySchedule = new Map<number, any[]>();
    for (const attempt of attempts) {
      const id = attempt.onlineExamConfig.examScheduleId;
      const list = attemptsBySchedule.get(id) || [];
      list.push(attempt);
      attemptsBySchedule.set(id, list);
    }

    let assigned = 0;
    let submitted = 0;
    let absent = 0;
    let ungraded = 0;
    let flagged = 0;
    let passCount = 0;
    const scores: number[] = [];
    const classes = new Map<number, { id: number; name: string }>();
    const periods = new Map<number, { id: number; name: string }>();
    const subjects = new Map<number, { id: number; code: string; name: string }>();
    const departments = new Map<number, { id: number; name: string }>();
    const scheduleRows = schedules.map((schedule) => {
      periods.set(schedule.examPeriod.id, { id: schedule.examPeriod.id, name: schedule.examPeriod.name });
      subjects.set(schedule.subject.id, { id: schedule.subject.id, code: schedule.subject.subjectCode, name: schedule.subject.subjectName });
      departments.set(schedule.subject.department.id, { id: schedule.subject.department.id, name: schedule.subject.department.name });
      const studentIds = new Set<number>();
      for (const room of schedule.examScheduleRooms) {
        for (const row of room.examRoomStudents) {
          if (!classId || row.student.classId === classId) studentIds.add(row.studentId);
          classes.set(row.student.class.id, { id: row.student.class.id, name: row.student.class.name });
        }
      }
      const scheduleAttempts = (attemptsBySchedule.get(schedule.id) || []).filter((attempt) => studentIds.has(attempt.studentId));
      const scheduleSubmitted = scheduleAttempts.filter((attempt) => submittedStatuses.includes(attempt.status));
      const scheduleScores = scheduleSubmitted.filter((attempt) => typeof attempt.totalScore === 'number').map((attempt) => attempt.totalScore as number);
      const scheduleFlagged = scheduleAttempts.filter((attempt) => attempt.isFlagged || attempt.riskScore > 0 || attempt.incidents.length > 0).length;
      const scheduleUngraded = scheduleSubmitted.filter((attempt) => attempt.totalScore === null).length;
      const schedulePassed = scheduleScores.filter((score) => score >= 5).length;

      assigned += studentIds.size;
      submitted += scheduleSubmitted.length;
      absent += Math.max(0, studentIds.size - scheduleSubmitted.length);
      ungraded += scheduleUngraded;
      flagged += scheduleFlagged;
      passCount += schedulePassed;
      scores.push(...scheduleScores);

      return {
        id: schedule.id,
        examPeriodId: schedule.examPeriodId,
        periodName: schedule.examPeriod.name,
        subjectId: schedule.subject.id,
        subjectCode: schedule.subject.subjectCode,
        subjectName: schedule.subject.subjectName,
        departmentId: schedule.subject.departmentId,
        departmentName: schedule.subject.department.name,
        examDate: schedule.examDate,
        assigned: studentIds.size,
        submitted: scheduleSubmitted.length,
        graded: scheduleScores.length,
        absent: Math.max(0, studentIds.size - scheduleSubmitted.length),
        ungraded: scheduleUngraded,
        flagged: scheduleFlagged,
        passCount: schedulePassed,
        avgScore: scheduleScores.length ? Number((scheduleScores.reduce((a, b) => a + b, 0) / scheduleScores.length).toFixed(2)) : 0,
      };
    });

    const scoreDistribution = {
      excellent: scores.filter((s) => s >= 9.0).length,
      good: scores.filter((s) => s >= 8.0 && s < 9.0).length,
      fair: scores.filter((s) => s >= 7.0 && s < 8.0).length,
      average: scores.filter((s) => s >= 5.0 && s < 7.0).length,
      poor: scores.filter((s) => s < 5.0).length,
      totalGraded: scores.length,
    };

    return {
      filters: { examPeriodId: examPeriodId ?? null, subjectId: subjectId ?? null, departmentId: departmentId ?? null, classId: classId ?? null, fromDate: query.fromDate || null, toDate: query.toDate || null },
      stats: {
        totalExams: new Set(schedules.map((schedule) => schedule.examPeriodId)).size,
        totalSchedules: schedules.length,
        totalAssigned: assigned,
        totalSubmitted: submitted,
        totalGraded: scores.length,
        totalAbsent: absent,
        totalUngraded: ungraded,
        totalFlagged: flagged,
        passCount,
        passRate: scores.length ? Number(((passCount / scores.length) * 100).toFixed(1)) : 0,
        avgScore: scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0,
        scoreDistribution,
      },
      schedules: scheduleRows,
      options: {
        classes: Array.from(classes.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        periods: Array.from(periods.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        subjects: Array.from(subjects.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
        departments: Array.from(departments.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      },
    };
  }
}
