import { BadRequestException } from '@nestjs/common';
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

  it('chỉ trả lịch được phân công cho TEACHER', async () => {
    const prisma: any = { examSchedule: { findMany: jest.fn().mockResolvedValue([]) } };
    const service = new ExamSchedulesService(prisma, { write: jest.fn() } as any);

    await service.findAll({ id: 7, role: 'TEACHER' }, 1);

    expect(prisma.examSchedule.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        examPeriodId: 1,
        examScheduleRooms: { some: { supervisors: { some: { teacher: { userId: 7 } } } } },
      }),
    }));
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
});
