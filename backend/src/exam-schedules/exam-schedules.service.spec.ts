import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExamSchedulesService } from './exam-schedules.service';

const period = {
  id: 1,
  semester: 'HK1',
  schoolYear: '2026-2027',
  startDate: new Date('2026-08-01T00:00:00.000Z'),
  endDate: new Date('2026-08-31T00:00:00.000Z'),
};

const createService = (overlaps: any[] = [], enrollmentConflict: any = null) => {
  const tx: any = {
    examPeriod: { findUnique: jest.fn().mockResolvedValue(period) },
    subject: { findUnique: jest.fn().mockResolvedValue({ id: 1, subjectName: 'Lập trình' }) },
    examSchedule: {
      findMany: jest.fn().mockResolvedValue(overlaps),
      create: jest.fn().mockResolvedValue({ id: 10, subject: { subjectName: 'Lập trình' } }),
    },
    studentSubject: { findFirst: jest.fn().mockResolvedValue(enrollmentConflict) },
    examScheduleRoom: { findFirst: jest.fn().mockResolvedValue(null) },
  };
  const prisma: any = { $transaction: jest.fn((callback) => callback(tx)) };
  const audit: any = { write: jest.fn().mockResolvedValue(undefined) };
  return { service: new ExamSchedulesService(prisma, audit), tx };
};

describe('ExamSchedulesService conflict rules', () => {
  const input = {
    examPeriodId: 1,
    subjectId: 1,
    examDate: '2026-08-15',
    startTime: '08:00',
    endTime: '09:30',
    examType: 'TRAC_NGHIEM' as const,
  };

  it('từ chối hai lịch cùng môn bị trùng giờ', async () => {
    const { service } = createService([{ id: 2, subjectId: 1, subject: { subjectName: 'Lập trình' } }]);
    await expect(service.create({ id: 1 }, input)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('từ chối lịch làm sinh viên đăng ký hai môn bị trùng giờ', async () => {
    const { service } = createService(
      [{ id: 2, subjectId: 2, subject: { subjectName: 'Cơ sở dữ liệu' } }],
      { student: { studentCode: 'SV001' } },
    );
    await expect(service.create({ id: 1 }, input)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('tạo lịch khi không có xung đột', async () => {
    const { service, tx } = createService();
    await expect(service.create({ id: 1 }, input)).resolves.toMatchObject({ id: 10 });
    expect(tx.examSchedule.create).toHaveBeenCalledTimes(1);
  });

  it('chỉ trả lịch thi thử cho TEACHER, không dựa vào phân công coi thi', async () => {
    const prisma: any = { examSchedule: { findMany: jest.fn().mockResolvedValue([]) } };
    const service = new ExamSchedulesService(prisma, { write: jest.fn() } as any);

    await service.findAll({ id: 7, role: 'TEACHER' }, 1);

    expect(prisma.examSchedule.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        examPeriodId: 1,
        mode: 'MOCK',
      }),
    }));
  });

  it('tự ép lịch do TEACHER tạo về chế độ MOCK', async () => {
    const { service, tx } = createService();

    await service.create({ id: 7, role: 'TEACHER' }, input);

    expect(tx.examSchedule.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ mode: 'MOCK' }),
    }));
  });

  it('từ chối TEACHER cố tạo lịch thi chính thức qua API', async () => {
    const { service } = createService();

    await expect(service.create({ id: 7, role: 'TEACHER' }, { ...input, mode: 'OFFICIAL' }))
      .rejects
      .toBeInstanceOf(ForbiddenException);
  });

  it('không lộ danh sách sinh viên khi TEACHER xem lịch coi của mình', async () => {
    const prisma: any = {
      examSchedule: {
        findFirst: jest.fn().mockResolvedValue({
          id: 5,
          examPeriod: {},
          subject: {},
          examPapers: [],
          examScheduleRooms: [{ id: 8, room: {}, supervisors: [], examRoomStudents: [{ studentId: 1 }] }],
        }),
      },
    };
    const service = new ExamSchedulesService(prisma, { write: jest.fn() } as any);

    const result: any = await service.findOne({ id: 7, role: 'TEACHER' }, 5);

    expect(result.examScheduleRooms[0]).not.toHaveProperty('examRoomStudents');
  });

  it('từ chối TEACHER mở lại thời gian của lịch không được phân công', async () => {
    const prisma: any = {
      $transaction: jest.fn((callback) => callback({
        examScheduleRoom: { findFirst: jest.fn().mockResolvedValue(null) },
      })),
    };
    const service = new ExamSchedulesService(prisma, { write: jest.fn() } as any);

    await expect(service.reopenEntry({ id: 7, role: 'TEACHER' }, 99, 30))
      .rejects
      .toBeInstanceOf(ForbiddenException);
  });

  it('dời lịch thi thành công và kích hoạt gửi thông báo', async () => {
    const existingSched = {
      id: 12,
      examPeriodId: 1,
      subjectId: 1,
      examDate: new Date('2026-08-15T00:00:00.000Z'),
      startTime: '08:00',
      endTime: '09:30',
      status: 'SCHEDULED',
      mode: 'OFFICIAL',
      note: '',
      examPeriod: period,
      subject: { id: 1, subjectName: 'Lập trình', subjectCode: 'IT101' },
      examScheduleRooms: [{ id: 5, roomId: 2, room: { roomCode: 'P101' }, examRoomStudents: [], supervisors: [] }],
    };
    const tx: any = {
      examSchedule: {
        update: jest.fn().mockResolvedValue({ ...existingSched, examDate: new Date('2026-08-20T00:00:00.000Z') }),
      },
    };
    const prisma: any = {
      examSchedule: {
        findFirst: jest.fn().mockResolvedValue(existingSched),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const audit: any = { write: jest.fn().mockResolvedValue(undefined) };
    const notifs: any = {
      notifyScheduleChange: jest.fn().mockResolvedValue({ totalNotified: 20 }),
      notifyScheduleCancelled: jest.fn().mockResolvedValue({ totalNotified: 20 }),
    };
    const service = new ExamSchedulesService(prisma, audit, undefined, notifs);

    const result = await service.reschedule({ id: 1, role: 'ADMIN' }, 12, {
      newExamDate: '2026-08-20',
      newStartTime: '10:00',
      newEndTime: '11:30',
      reason: 'Bảo trì phòng máy',
    });

    expect(result.message).toContain('Đã dời lịch thi môn Lập trình');
    expect(result.totalNotified).toBe(20);
    expect(notifs.notifyScheduleChange).toHaveBeenCalled();
  });

  it('hủy ca thi thành công và kích hoạt gửi thông báo hủy', async () => {
    const existingSched = {
      id: 15,
      examDate: new Date('2026-08-15T00:00:00.000Z'),
      startTime: '08:00',
      endTime: '09:30',
      status: 'SCHEDULED',
      mode: 'OFFICIAL',
      note: '',
      examPeriod: period,
      subject: { id: 1, subjectName: 'Lập trình' },
      examScheduleRooms: [],
    };
    const tx: any = {
      examSchedule: {
        update: jest.fn().mockResolvedValue({ ...existingSched, status: 'CANCELLED' }),
      },
    };
    const prisma: any = {
      examSchedule: { findFirst: jest.fn().mockResolvedValue(existingSched) },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const audit: any = { write: jest.fn().mockResolvedValue(undefined) };
    const notifs: any = {
      notifyScheduleChange: jest.fn().mockResolvedValue({ totalNotified: 0 }),
      notifyScheduleCancelled: jest.fn().mockResolvedValue({ totalNotified: 15 }),
    };
    const service = new ExamSchedulesService(prisma, audit, undefined, notifs);

    const result = await service.cancelSchedule({ id: 1, role: 'ADMIN' }, 15, {
      reason: 'Sự cố mất điện diện rộng',
    });

    expect(result.schedule.status).toBe('CANCELLED');
    expect(result.totalNotified).toBe(15);
    expect(notifs.notifyScheduleCancelled).toHaveBeenCalled();
  });
});

