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
    expect(prisma.gradeAppeal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'appeal-1',
          student: { userId: 42 },
        },
      }),
    );
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
    expect(where.attempt.onlineExamConfig.examSchedule.examScheduleRooms).toEqual({
      some: { supervisors: { some: { teacher: { userId: 7 } } } },
    });
  });

  it('Admin mở chi tiết đơn mà không bị giới hạn theo ca', async () => {
    const appeal = { id: 'appeal-3', studentId: 99 };
    prisma.gradeAppeal.findFirst.mockResolvedValue(appeal);

    await expect(service.findOne({ id: 1, role: 'ADMIN' }, 'appeal-3')).resolves.toBe(appeal);
    expect(prisma.gradeAppeal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'appeal-3' } }),
    );
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
});
