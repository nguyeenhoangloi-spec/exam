import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamScheduleDto, UpdateExamScheduleDto } from './dto/exam-schedule.dto';

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

  async findAll(actor: Actor, examPeriodId?: number) {
    return this.prisma.examSchedule.findMany({
      where: {
        ...(examPeriodId ? { examPeriodId } : {}),
        ...(actor.role === 'TEACHER' ? {
          examScheduleRooms: {
            some: { supervisors: { some: { teacher: { userId: actor.id } } } },
          },
        } : {}),
      },
      include: {
        examPeriod: true,
        subject: true,
        examScheduleRooms: { include: { room: true, _count: { select: { examRoomStudents: true, supervisors: true } } } },
      },
      orderBy: { examDate: 'asc' },
    });
  }

  async findOne(actor: Actor, id: number) {
    const schedule = await this.prisma.examSchedule.findFirst({
      where: {
        id,
        ...(actor.role === 'TEACHER' ? {
          examScheduleRooms: {
            some: { supervisors: { some: { teacher: { userId: actor.id } } } },
          },
        } : {}),
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
        examPapers: true,
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

  async update(actor: Actor, id: number, data: UpdateExamScheduleDto) {
    const existing = await this.findOne(actor, id);
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
          ...data,
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
    if (existing.examScheduleRooms.length > 0 || existing.examPapers.length > 0) {
      throw new BadRequestException('Không thể xóa lịch đã xếp phòng hoặc đã có đề thi. Hãy cập nhật trạng thái hủy thay vì xóa.');
    }
    return this.prisma.$transaction(async (tx) => {
      const removed = await tx.examSchedule.delete({ where: { id } });
      await this.audit.write({
        actorId: actor.id,
        action: 'DELETE',
        entityType: 'EXAM_SCHEDULE',
        entityId: id,
        description: `Đã xóa lịch thi môn ${existing.subject.subjectName}`,
      }, tx);
      return removed;
    });
  }
}
