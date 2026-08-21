import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutoScheduleProposalDto, CreateExamScheduleDto, UpdateExamScheduleDto } from './dto/exam-schedule.dto';

type Actor = { id: number; role?: string };
type ScheduleData = CreateExamScheduleDto | UpdateExamScheduleDto;
type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class ExamSchedulesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private serializable<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      .catch((error: any) => {
        if (error?.code === 'P2034') {
          throw new ConflictException('Lịch thi vừa được thay đổi bởi thao tác khác. Vui lòng tải lại và thử lại.');
        }
        throw error;
      });
  }

  /** Read-only validation report used before any bulk scheduling/arrangement action. */
  async conflicts(examPeriodId?: number) {
    const schedules = await this.prisma.examSchedule.findMany({
      where: examPeriodId ? { examPeriodId, deletedAt: null } : { deletedAt: null },
      include: {
        subject: true,
        examPeriod: true,
        examScheduleRooms: {
          include: {
            room: true,
            examRoomStudents: { select: { studentId: true } },
            supervisors: { select: { teacherId: true } },
          },
        },
      },
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });
    const errors: Array<{ code: string; scheduleIds: number[]; message: string }> = [];
    const warnings: Array<{ code: string; scheduleIds: number[]; message: string }> = [];
    const overlaps = (a: any, b: any) => a.examDate.toISOString().slice(0, 10) === b.examDate.toISOString().slice(0, 10)
      && a.startTime < b.endTime && a.endTime > b.startTime
      && a.status !== 'CANCELLED' && b.status !== 'CANCELLED';

    for (const schedule of schedules) {
      const periodStart = this.dayRange(schedule.examPeriod.startDate).start;
      const periodEnd = this.dayRange(schedule.examPeriod.endDate).end;
      if (schedule.examDate < periodStart || schedule.examDate >= periodEnd) {
        errors.push({ code: 'OUTSIDE_PERIOD', scheduleIds: [schedule.id], message: `Lịch ${schedule.id} nằm ngoài thời gian kỳ thi.` });
      }
      for (const room of schedule.examScheduleRooms) {
        if (room.examRoomStudents.length > room.room.capacity) {
          errors.push({ code: 'CAPACITY', scheduleIds: [schedule.id], message: `Phòng ${room.room.roomCode} vượt sức chứa.` });
        }
        if (room.supervisors.length < 2) {
          errors.push({ code: 'MISSING_SUPERVISOR', scheduleIds: [schedule.id], message: `Phòng ${room.room.roomCode} chưa đủ 2 giám thị.` });
        }
      }
    }
    for (let i = 0; i < schedules.length; i += 1) {
      for (let j = i + 1; j < schedules.length; j += 1) {
        const a = schedules[i];
        const b = schedules[j];
        if (!overlaps(a, b)) continue;
        if (a.subjectId === b.subjectId) {
          errors.push({ code: 'SUBJECT_TIME_OVERLAP', scheduleIds: [a.id, b.id], message: `Môn ${a.subject.subjectName} có hai lịch trùng giờ.` });
        }
        const aRooms = new Set(a.examScheduleRooms.map((room) => room.roomId));
        const sharedRoom = b.examScheduleRooms.find((room) => aRooms.has(room.roomId));
        if (sharedRoom) {
          errors.push({ code: 'ROOM_TIME_OVERLAP', scheduleIds: [a.id, b.id], message: `Phòng ${sharedRoom.room.roomCode} bị trùng lịch.` });
        }
        const aStudents = new Set(a.examScheduleRooms.flatMap((room) => room.examRoomStudents.map((student) => student.studentId)));
        const sharedStudent = b.examScheduleRooms.some((room) => room.examRoomStudents.some((student) => aStudents.has(student.studentId)));
        if (sharedStudent) {
          errors.push({ code: 'STUDENT_TIME_OVERLAP', scheduleIds: [a.id, b.id], message: 'Có sinh viên bị xếp vào hai lịch thi trùng giờ.' });
        }
        const aTeachers = new Set(a.examScheduleRooms.flatMap((room) => room.supervisors.map((supervisor) => supervisor.teacherId)));
        const sharedTeacher = b.examScheduleRooms.some((room) => room.supervisors.some((supervisor) => aTeachers.has(supervisor.teacherId)));
        if (sharedTeacher) {
          errors.push({ code: 'TEACHER_TIME_OVERLAP', scheduleIds: [a.id, b.id], message: 'Có giảng viên bị phân công hai lịch trùng giờ.' });
        }
      }
    }
    if (schedules.length > 1) warnings.push({ code: 'SOFT_BALANCE', scheduleIds: schedules.map((schedule) => schedule.id), message: 'Có thể cân bằng lại các ca thi để giảm lịch liên tiếp trong cùng ngày.' });
    const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 3);
    return {
      generatedAt: new Date().toISOString(),
      examPeriodId: examPeriodId ?? null,
      score,
      isValid: errors.length === 0,
      errors,
      warnings,
      unassigned: [],
      alternatives: errors.length ? [{ action: 'REVIEW_CONFLICTS', rationale: 'Đổi khung giờ/phòng hoặc hủy lịch xung đột trước khi lưu phương án.' }] : [{ action: 'BALANCE_SLOTS', rationale: 'Có thể chạy lại báo cáo sau khi bổ sung lịch mới để cân bằng tải.' }],
      rationale: 'Báo cáo chỉ đọc; không thay đổi lịch, phòng, sinh viên hoặc giám thị.',
    };
  }

  async previewAutoSchedule(examPeriodId: number, subjectIds?: number[]) {
    const period = await this.prisma.examPeriod.findUnique({ where: { id: examPeriodId } });
    if (!period) throw new NotFoundException('Không tìm thấy kỳ thi.');
    if (['CANCELLED', 'COMPLETED', 'LOCKED'].includes(period.status)) throw new BadRequestException('Không thể đề xuất lịch cho kỳ thi đã hủy, hoàn thành hoặc đã khóa.');
    const existing = await this.prisma.examSchedule.findMany({
      where: { examPeriodId, status: { not: 'CANCELLED' }, deletedAt: null },
      include: { subject: true },
    });
    const activeSubjectIds = subjectIds?.length ? subjectIds : (await this.prisma.subject.findMany({ select: { id: true } })).map((subject) => subject.id);
    const existingSubjectIds = new Set(existing.map((schedule) => schedule.subjectId));
    const targetIds = activeSubjectIds.filter((id) => !existingSubjectIds.has(id));
    const subjects = await this.prisma.subject.findMany({ where: { id: { in: targetIds } }, select: { id: true, subjectCode: true, subjectName: true } });
    const enrollmentSubjectIds = Array.from(new Set([...targetIds, ...existing.map((schedule) => schedule.subjectId)]));
    const enrollments = await this.prisma.studentSubject.findMany({ where: { subjectId: { in: enrollmentSubjectIds }, semester: period.semester, schoolYear: period.schoolYear, status: 'ELIGIBLE' }, select: { subjectId: true, studentId: true } });
    const studentBySubject = new Map<number, Set<number>>();
    for (const enrollment of enrollments) {
      if (!studentBySubject.has(enrollment.subjectId)) studentBySubject.set(enrollment.subjectId, new Set());
      studentBySubject.get(enrollment.subjectId)!.add(enrollment.studentId);
    }
    const slots = [['08:00', '09:30'], ['10:00', '11:30'], ['13:30', '15:00'], ['15:30', '17:00']];
    const proposals: Array<AutoScheduleProposalDto & { subjectCode: string; subjectName: string; score: number }> = [];
    const unassigned: Array<{ subjectId: number; subjectName?: string; reason: string }> = [];
    const alternativePlans: Array<{ subjectId: number; subjectName: string; examDate: string; startTime: string; endTime: string; score: number; rationale: string }> = [];
    const planned: any[] = [];
    const periodStart = this.dayRange(period.startDate).start;
    const periodEnd = this.dayRange(period.endDate).start;
    const overlaps = (a: any, date: Date, startTime: string, endTime: string) => a.status !== 'CANCELLED'
      && new Date(a.examDate).toISOString().slice(0, 10) === date.toISOString().slice(0, 10)
      && a.startTime < endTime && a.endTime > startTime;
    for (const subject of subjects) {
      const students = studentBySubject.get(subject.id) || new Set<number>();
      if (!students.size) {
        unassigned.push({ subjectId: subject.id, subjectName: subject.subjectName, reason: 'Không có sinh viên đủ điều kiện thi trong kỳ.' });
        continue;
      }
      const options: Array<{ date: Date; startTime: string; endTime: string; score: number }> = [];
      for (let date = new Date(periodStart); date <= periodEnd; date.setUTCDate(date.getUTCDate() + 1)) {
        for (const [startTime, endTime] of slots) {
          const sameSlot = [...existing, ...planned].filter((schedule) => overlaps(schedule, date, startTime, endTime));
          const studentConflict = sameSlot.some((schedule) => {
            const other = studentBySubject.get(schedule.subjectId);
            return other && [...students].some((studentId) => other.has(studentId));
          });
          if (studentConflict) continue;
          const dayLoad = sameSlot.length;
          const score = 100 - dayLoad * 8 - (date.getUTCDay() === 0 ? 5 : 0);
          options.push({ date: new Date(date), startTime, endTime, score });
        }
      }
      options.sort((a, b) => b.score - a.score || a.date.getTime() - b.date.getTime() || a.startTime.localeCompare(b.startTime));
      const best = options[0];
      if (!best) {
        unassigned.push({ subjectId: subject.id, subjectName: subject.subjectName, reason: 'Không còn khung giờ không xung đột.' });
        continue;
      }
      const proposal = { examPeriodId, subjectId: subject.id, examDate: best.date.toISOString(), startTime: best.startTime, endTime: best.endTime, examType: 'TRAC_NGHIEM' as const, subjectCode: subject.subjectCode, subjectName: subject.subjectName, score: best.score };
      proposals.push(proposal);
      for (const alternative of options.slice(1, 4)) alternativePlans.push({ subjectId: subject.id, subjectName: subject.subjectName, examDate: alternative.date.toISOString(), startTime: alternative.startTime, endTime: alternative.endTime, score: alternative.score, rationale: 'Khung giờ hợp lệ thay thế, điểm tối ưu thấp hơn phương án chính.' });
      planned.push(proposal);
    }
    return {
      preview: true,
      examPeriod: { id: period.id, name: period.name, startDate: period.startDate, endDate: period.endDate },
      score: proposals.length ? Math.round(proposals.reduce((sum, proposal) => sum + proposal.score, 0) / proposals.length) : 0,
      isValid: unassigned.length === 0,
      proposals,
      errors: [],
      warnings: proposals.length > 1 ? ['Các môn được dàn đều theo các khung giờ còn trống.'] : [],
      unassigned,
      alternatives: alternativePlans.length ? alternativePlans : [{ rationale: unassigned.length ? 'Mở rộng ngày thi hoặc thêm khung giờ trong kỳ.' : 'Có thể chạy lại preview để chọn phương án khung giờ khác.' }],
      rationale: 'Ưu tiên khung giờ không trùng sinh viên, sau đó tối ưu tải lịch trong ngày.',
    };
  }

  async acceptAutoSchedule(actor: Actor, proposals: AutoScheduleProposalDto[]) {
    if (!proposals?.length) throw new BadRequestException('Phương án không có lịch để lưu.');
    return this.serializable(async (tx) => {
      const created: any[] = [];
      for (const proposal of proposals) {
        const period = await this.validatePeriodDate(tx, proposal.examPeriodId, proposal.examDate);
        if (['CANCELLED', 'COMPLETED', 'LOCKED'].includes(period.status)) throw new BadRequestException('Không thể lưu lịch vào kỳ thi đã hủy, hoàn thành hoặc đã khóa.');
        const subject = await this.subject(tx, proposal.subjectId);
        await this.validateNoConflicts(tx, { subjectId: proposal.subjectId, examDate: proposal.examDate, startTime: proposal.startTime, endTime: proposal.endTime, periodId: period.id });
        const schedule = await tx.examSchedule.create({ data: { examPeriodId: period.id, subjectId: subject.id, examDate: this.dayRange(proposal.examDate).start, startTime: proposal.startTime, endTime: proposal.endTime, examType: proposal.examType || 'TRAC_NGHIEM', status: 'SCHEDULED' }, include: { subject: true, examPeriod: true } });
        created.push(schedule);
        await this.audit.write({ actorId: actor.id, action: 'AUTO_SCHEDULE', entityType: 'EXAM_SCHEDULE', entityId: schedule.id, description: `Đã lưu lịch thi tự động cho môn ${subject.subjectName}`, metadata: { proposal: { examPeriodId: proposal.examPeriodId, subjectId: proposal.subjectId, examDate: proposal.examDate, startTime: proposal.startTime, endTime: proposal.endTime } } }, tx);
      }
      return { successCount: created.length, failedCount: 0, data: created };
    });
  }

  async findAll(actor: Actor, examPeriodId?: number, mode?: 'MOCK' | 'OFFICIAL') {
    return this.prisma.examSchedule.findMany({
      where: {
        deletedAt: null,
        ...(examPeriodId ? { examPeriodId } : {}),
        // Giảng viên chỉ thao tác luồng thi thử. Không dùng phân công coi thi
        // làm điều kiện vì thi thử không có phòng hoặc giám thị.
        ...(actor.role === 'TEACHER' ? { mode: 'MOCK' } : (mode ? { mode } : {})),
      },
      include: {
        examPeriod: true,
        subject: true,
        examPapers: { where: { deletedAt: null }, select: { id: true, paperCode: true, status: true } },
        examScheduleRooms: { include: { room: true, _count: { select: { examRoomStudents: true, supervisors: true } } } },
      },
      orderBy: { examDate: 'asc' },
    });
  }

  async findOne(actor: Actor, id: number) {
    const schedule = await this.prisma.examSchedule.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(actor.role === 'TEACHER' ? { mode: 'MOCK' } : {}),
      },
      include: {
        examPeriod: true,
        subject: true,
        examScheduleRooms: {
          include: {
            room: true,
            supervisors: { include: { teacher: true } },
            examRoomStudents: { include: { student: { include: { class: true } } } },
          },
        },
        examPapers: { where: { deletedAt: null } },
      },
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch thi.');
    if (actor.role === 'TEACHER') {
      return {
        ...schedule,
        examScheduleRooms: schedule.examScheduleRooms.map(({ examRoomStudents, ...scheduleRoom }) => scheduleRoom),
      };
    }
    return schedule;
  }

  private dayRange(value: string | Date) {
    const source = value instanceof Date ? value.toISOString().slice(0, 10) : value;
    const start = new Date(`${source}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) throw new BadRequestException('Ngày thi không hợp lệ.');
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private assertTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
    }
  }

  private async period(client: DbClient, id: number) {
    const period = await client.examPeriod.findUnique({ where: { id } });
    if (!period) throw new BadRequestException('Kỳ thi được chọn không tồn tại.');
    return period;
  }

  private async subject(client: DbClient, id: number) {
    const subject = await client.subject.findUnique({ where: { id } });
    if (!subject) throw new BadRequestException('Môn học được chọn không tồn tại.');
    return subject;
  }

  private async validatePeriodDate(client: DbClient, periodId: number, examDate: string | Date) {
    const period = await this.period(client, periodId);
    const { start } = this.dayRange(examDate);
    const periodStart = this.dayRange(period.startDate).start;
    const periodEnd = this.dayRange(period.endDate).end;
    if (period.startDate > period.endDate || start < periodStart || start >= periodEnd) {
      throw new BadRequestException('Ngày thi phải nằm trong khoảng thời gian của kỳ thi.');
    }
    return period;
  }

  private async validateNoConflicts(
    client: DbClient,
    input: { id?: number; subjectId: number; examDate: string | Date; startTime: string; endTime: string; periodId: number; roomIds?: number[] },
  ) {
    const { start, end } = this.dayRange(input.examDate);
    const overlappingSchedules = await client.examSchedule.findMany({
      where: {
        ...(input.id ? { id: { not: input.id } } : {}),
        status: { not: 'CANCELLED' },
        deletedAt: null,
        examDate: { gte: start, lt: end },
        startTime: { lt: input.endTime },
        endTime: { gt: input.startTime },
      },
      select: { id: true, subjectId: true, subject: { select: { subjectName: true } } },
    });

    const sameSubject = overlappingSchedules.find((schedule) => schedule.subjectId === input.subjectId);
    if (sameSubject) {
      throw new BadRequestException(`Môn học đã có lịch thi trùng khung giờ: ${sameSubject.subject.subjectName}.`);
    }

    const period = await this.period(client, input.periodId);
    const overlapSubjectIds = overlappingSchedules.map((schedule) => schedule.subjectId);
    if (overlapSubjectIds.length > 0) {
      const conflictingEnrollment = await client.studentSubject.findFirst({
        where: {
          subjectId: input.subjectId,
          semester: period.semester,
          schoolYear: period.schoolYear,
          status: 'ELIGIBLE',
          student: {
            studentSubjects: {
              some: {
                subjectId: { in: overlapSubjectIds },
                semester: period.semester,
                schoolYear: period.schoolYear,
                status: 'ELIGIBLE',
              },
            },
          },
        },
        include: { student: true },
      });
      if (conflictingEnrollment) {
        throw new BadRequestException(
          `Sinh viên ${conflictingEnrollment.student.studentCode} có môn thi khác bị trùng khung giờ.`,
        );
      }
    }

    if (input.roomIds?.length) {
      const roomConflict = await client.examScheduleRoom.findFirst({
        where: {
          roomId: { in: input.roomIds },
          examScheduleId: input.id ? { not: input.id } : undefined,
          examSchedule: {
            status: { not: 'CANCELLED' },
            deletedAt: null,
            examDate: { gte: start, lt: end },
            startTime: { lt: input.endTime },
            endTime: { gt: input.startTime },
          },
        },
        include: { room: true },
      });
      if (roomConflict) {
        throw new BadRequestException(`Phòng ${roomConflict.room.roomCode} đã được sử dụng ở một lịch thi trùng giờ.`);
      }
    }
  }

  async create(actor: Actor, data: CreateExamScheduleDto) {
    if (actor.role === 'TEACHER' && data.mode && data.mode !== 'MOCK') {
      throw new ForbiddenException('Giảng viên chỉ được tạo lịch thi thử. Lịch thi chính thức do quản trị viên quản lý.');
    }
    this.assertTimeRange(data.startTime, data.endTime);
    return this.serializable(async (tx) => {
      const [period, subject] = await Promise.all([
        this.validatePeriodDate(tx, data.examPeriodId, data.examDate),
        this.subject(tx, data.subjectId),
      ]);
      await this.validateNoConflicts(tx, {
        subjectId: data.subjectId,
        examDate: data.examDate,
        startTime: data.startTime,
        endTime: data.endTime,
        periodId: period.id,
      });
      const schedule = await tx.examSchedule.create({
        data: {
          examPeriodId: data.examPeriodId,
          subjectId: data.subjectId,
          examDate: this.dayRange(data.examDate).start,
          startTime: data.startTime,
          endTime: data.endTime,
          examType: data.examType || 'TRAC_NGHIEM',
          mode: actor.role === 'TEACHER' ? 'MOCK' : ((data.mode as any) || 'OFFICIAL'),
          status: data.status || 'SCHEDULED',
          note: data.note,
        },
        include: { examPeriod: true, subject: true },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'CREATE',
        entityType: 'EXAM_SCHEDULE',
        entityId: schedule.id,
        description: `Đã tạo lịch thi môn ${subject.subjectName}`,
      }, tx);
      return schedule;
    });
  }

  async update(actor: Actor, id: number, data: UpdateExamScheduleDto, allowUnlock = false) {
    const existing = await this.findOne(actor, id);
    if (actor.role === 'TEACHER' && data.mode && data.mode !== 'MOCK') {
      throw new ForbiddenException('Giảng viên không được chuyển lịch thi thử thành lịch thi chính thức.');
    }
    if (existing.status === 'LOCKED' && !allowUnlock) {
      throw new BadRequestException('Lịch thi đã khóa, chỉ được mở khóa trước khi thay đổi.');
    }
    if (existing.examPapers.some((paper) => paper.status === 'PUBLISHED' && !paper.deletedAt)) {
      throw new BadRequestException('Lịch thi đã có đề công bố, không được thay đổi.');
    }
    const subjectId = data.subjectId ?? existing.subjectId;
    const periodId = data.examPeriodId ?? existing.examPeriodId;
    const examDate = data.examDate ?? existing.examDate;
    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;
    this.assertTimeRange(startTime, endTime);

    const changesTimingOrIdentity = subjectId !== existing.subjectId
      || periodId !== existing.examPeriodId
      || this.dayRange(examDate).start.getTime() !== this.dayRange(existing.examDate).start.getTime()
      || startTime !== existing.startTime
      || endTime !== existing.endTime;
    if (changesTimingOrIdentity && (existing.examScheduleRooms.length > 0 || existing.examPapers.length > 0)) {
      throw new BadRequestException('Không thể đổi môn, kỳ, ngày hoặc giờ của lịch đã xếp phòng hoặc đã có đề thi.');
    }

    return this.serializable(async (tx) => {
      await Promise.all([
        this.validatePeriodDate(tx, periodId, examDate),
        this.subject(tx, subjectId),
      ]);
      // A cancellation is deliberately allowed even if the schedule has since
      // become conflicting.  It removes the schedule from all active conflict
      // checks; blocking this transition would make an invalid schedule
      // impossible to resolve.
      if (data.status !== 'CANCELLED') {
        await this.validateNoConflicts(tx, {
          id,
          subjectId,
          examDate,
          startTime,
          endTime,
          periodId,
          roomIds: existing.examScheduleRooms.map((room) => room.roomId),
        });
      }
      const schedule = await tx.examSchedule.update({
        where: { id },
        data: {
          ...(data as any),
          ...(actor.role === 'TEACHER' ? { mode: 'MOCK' } : {}),
          examDate: data.examDate ? this.dayRange(data.examDate).start : undefined,
        },
        include: { examPeriod: true, subject: true },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'UPDATE',
        entityType: 'EXAM_SCHEDULE',
        entityId: schedule.id,
        description: `Đã cập nhật lịch thi môn ${schedule.subject.subjectName}`,
      }, tx);
      return schedule;
    });
  }

  async remove(actor: Actor, id: number) {
    const existing = await this.findOne(actor, id);
    return this.prisma.$transaction(async (tx) => {
      const removed = await tx.examSchedule.update({
        where: { id },
        data: { deletedAt: new Date(), deletedById: actor.id, status: 'CANCELLED' },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'DELETE',
        entityType: 'EXAM_SCHEDULE',
        entityId: id,
        description: `Đã đưa lịch thi môn ${existing.subject.subjectName} vào thùng rác`,
      }, tx);
      return removed;
    });
  }

  async reopenEntry(actor: Actor, id: number, minutes: number) {
    if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
      throw new ForbiddenException('Chỉ Cán bộ coi thi hoặc Quản trị viên mới được mở lại thời gian vào thi.');
    }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 24 * 60) {
      throw new BadRequestException('Thời gian mở lại phải từ 1 đến 1440 phút.');
    }
    return this.serializable(async (tx) => {
      if (actor.role === 'TEACHER') {
        const assignment = await tx.examScheduleRoom.findFirst({
          where: {
            examScheduleId: id,
            supervisors: { some: { teacher: { userId: actor.id } } },
          },
          select: { id: true },
        });
        if (!assignment) {
          throw new ForbiddenException('Bạn không được phân công giám thị lịch thi này.');
        }
      }

      const schedule = await tx.examSchedule.findFirst({
        where: { id, deletedAt: null },
        include: { subject: true, onlineExamConfig: true, examPapers: { where: { deletedAt: null, status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, take: 1 } },
      });
      if (!schedule) throw new NotFoundException('Không tìm thấy lịch thi đang hoạt động.');
      if (schedule.status === 'CANCELLED' || schedule.status === 'LOCKED') throw new BadRequestException('Không thể mở lại lịch đã hủy hoặc khóa.');
      const paper = schedule.onlineExamConfig?.examPaperId ?? schedule.examPapers[0]?.id;
      if (!paper) throw new BadRequestException('Lịch thi chưa có đề thi PUBLISHED để mở lại.');
      const config = await tx.onlineExamConfig.upsert({
        where: { examScheduleId: id },
        update: { lateEntryWindowMinutes: minutes, mode: schedule.mode },
        create: { examScheduleId: id, examPaperId: paper, lateEntryWindowMinutes: minutes, mode: schedule.mode },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'REOPEN_ENTRY',
        entityType: 'EXAM_SCHEDULE',
        entityId: id,
        description: `Đã mở lại thời gian vào thi môn ${schedule.subject.subjectName} thêm ${minutes} phút`,
        metadata: { lateEntryWindowMinutes: minutes },
      }, tx);
      return { scheduleId: id, lateEntryWindowMinutes: config.lateEntryWindowMinutes, message: `Đã mở lại thời gian vào thi trong ${minutes} phút.` };
    });
  }

  async findTrash(actor: Actor, examPeriodId?: number) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException('Chỉ quản trị viên được xem thùng rác lịch thi.');
    return this.prisma.examSchedule.findMany({
      where: { deletedAt: { not: null }, ...(examPeriodId ? { examPeriodId } : {}) },
      include: {
        examPeriod: true,
        subject: true,
        deletedBy: { select: { id: true, username: true } },
        examScheduleRooms: { include: { room: true, _count: { select: { examRoomStudents: true, supervisors: true } } } },
        examPapers: { where: { deletedAt: null }, select: { id: true, paperCode: true, status: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async restore(actor: Actor, id: number) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException('Chỉ quản trị viên được khôi phục lịch thi.');
    const existing = await this.prisma.examSchedule.findFirst({
      where: { id, deletedAt: { not: null } },
      include: { subject: true, examScheduleRooms: { select: { roomId: true } } },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy lịch thi trong thùng rác.');
    await this.validatePeriodDate(this.prisma, existing.examPeriodId, existing.examDate);
    this.assertTimeRange(existing.startTime, existing.endTime);
    await this.validateNoConflicts(this.prisma, {
      id,
      subjectId: existing.subjectId,
      examDate: existing.examDate,
      startTime: existing.startTime,
      endTime: existing.endTime,
      periodId: existing.examPeriodId,
      roomIds: existing.examScheduleRooms.map((room) => room.roomId),
    });
    return this.serializable(async (tx) => {
      const restored = await tx.examSchedule.update({
        where: { id },
        data: { deletedAt: null, deletedById: null, status: 'SCHEDULED' },
        include: { examPeriod: true, subject: true },
      });
      await this.audit.write({
        actorId: actor.id,
        action: 'RESTORE',
        entityType: 'EXAM_SCHEDULE',
        entityId: id,
        description: `Đã khôi phục lịch thi môn ${restored.subject.subjectName}`,
      }, tx);
      return restored;
    });
  }
}
