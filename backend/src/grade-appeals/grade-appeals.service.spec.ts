import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GradeAppealsService } from './grade-appeals.service';

describe('GradeAppealsService permissions', () => {
  const prisma = {
    gradeAppeal: {
      findFirst: jest.fn(),
    },
  };
  const audit = { write: jest.fn() };
  const service = new GradeAppealsService(prisma as any, audit as any);

  beforeEach(() => jest.clearAllMocks());

  it('chỉ trả về đơn phúc khảo thuộc sinh viên đang đăng nhập', async () => {
    const appeal = { id: 'appeal-1', studentId: 12 };
    prisma.gradeAppeal.findFirst.mockResolvedValue(appeal);

    await expect(service.findOne({ id: 42, role: 'STUDENT' }, 'appeal-1')).resolves.toBe(appeal);
    const where = prisma.gradeAppeal.findFirst.mock.calls[0][0].where;
    expect(where.id).toBe('appeal-1');
    expect(where.student).toEqual({ userId: 42 });
    expect(where.AND).toEqual(expect.arrayContaining([
      { attempt: { onlineExamConfig: { examSchedule: { mode: 'OFFICIAL' } } } },
    ]));
  });

  it('không tiết lộ đơn phúc khảo của tài khoản khác', async () => {
    prisma.gradeAppeal.findFirst.mockResolvedValue(null);

    await expect(service.findOne({ id: 42, role: 'STUDENT' }, 'appeal-of-another-student')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('chỉ cho Giảng viên mở chi tiết đơn thuộc ca được phân công', async () => {
    const appeal = { id: 'appeal-2', studentId: 99 };
    prisma.gradeAppeal.findFirst.mockResolvedValue(appeal);

    await expect(service.findOne({ id: 7, role: 'TEACHER' }, 'appeal-2')).resolves.toBe(appeal);
    const where = prisma.gradeAppeal.findFirst.mock.calls[0][0].where;
    expect(where.id).toBe('appeal-2');
    expect(where.AND).toEqual(expect.arrayContaining([
      { attempt: { onlineExamConfig: { examSchedule: { mode: 'OFFICIAL' } } } },
      { attempt: { onlineExamConfig: { examSchedule: { examScheduleRooms: { some: { supervisors: { some: { teacher: { userId: 7 } } } } } } } } },
    ]));
  });

  it('Admin mở chi tiết đơn mà không bị giới hạn theo ca', async () => {
    const appeal = { id: 'appeal-3', studentId: 99 };
    prisma.gradeAppeal.findFirst.mockResolvedValue(appeal);

    await expect(service.findOne({ id: 1, role: 'ADMIN' }, 'appeal-3')).resolves.toBe(appeal);
    const where = prisma.gradeAppeal.findFirst.mock.calls[0][0].where;
    expect(where.id).toBe('appeal-3');
    expect(where.AND).toEqual(expect.arrayContaining([
      { attempt: { onlineExamConfig: { examSchedule: { mode: 'OFFICIAL' } } } },
    ]));
  });

  it('không cho sinh viên phúc khảo trước khi kết quả được công bố', async () => {
    const scopedPrisma: any = {
      student: { findUnique: jest.fn().mockResolvedValue({ id: 12 }) },
      examAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'attempt-1',
          studentId: 12,
          status: 'SUBMITTED',
          totalScore: 8,
          publishedAt: null,
        }),
      },
    };
    const scopedService = new GradeAppealsService(scopedPrisma, audit as any);

    await expect(scopedService.createAppeal(42, {
      attemptId: 'attempt-1',
      reason: 'Đề nghị kiểm tra lại kết quả.',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('không cho sinh viên phúc khảo kết quả thi thử', async () => {
    const scopedPrisma: any = {
      student: { findUnique: jest.fn().mockResolvedValue({ id: 12 }) },
      examAttempt: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'attempt-mock',
          studentId: 12,
          totalScore: 8,
          publishedAt: new Date(),
          onlineExamConfig: { examSchedule: { mode: 'MOCK' } },
        }),
      },
    };
    const scopedService = new GradeAppealsService(scopedPrisma, audit as any);

    await expect(scopedService.createAppeal(42, {
      attemptId: 'attempt-mock',
      reason: 'Đề nghị kiểm tra lại kết quả thi thử.',
    })).rejects.toThrow('không hỗ trợ phúc khảo');
  });
});
