import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExamPapersService } from './exam-papers.service';

describe('ExamPapersService permissions', () => {
  const prisma = {
    examPaper: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  const audit = { write: jest.fn() };
  const service = new ExamPapersService(prisma as any, audit as any);

  beforeEach(() => jest.clearAllMocks());

  it('giới hạn danh sách TEACHER theo người tạo', async () => {
    prisma.examPaper.findMany.mockResolvedValue([]);
    await service.findAll({ id: 7, role: 'TEACHER' }, 2);

    expect(prisma.examPaper.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          examScheduleId: 2,
          createdById: 7,
        }),
      }),
    );
  });

  it('ADMIN xem được toàn bộ đề không bị xóa', async () => {
    prisma.examPaper.findMany.mockResolvedValue([]);
    await service.findAll({ id: 1, role: 'ADMIN' });

    const call = prisma.examPaper.findMany.mock.calls[0][0];
    expect(call.where).toEqual({ deletedAt: null, examSchedule: { deletedAt: null } });
  });

  it('không cho TEACHER xem đề của người khác', async () => {
    prisma.examPaper.findFirst.mockResolvedValue({
      id: 1,
      createdById: 99,
      paperCode: '001',
      status: 'DRAFT',
    });

    await expect(service.findOne({ id: 7, role: 'TEACHER' }, 1)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('từ chối đề có thời lượng dài hơn ca thi', async () => {
    const tx: any = {
      examSchedule: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2,
          status: 'SCHEDULED',
          startTime: '08:00',
          endTime: '09:00',
          subject: { subjectName: 'Lập trình' },
          examPeriod: {},
        }),
      },
    };
    const timedService = new ExamPapersService(
      { $transaction: jest.fn((callback) => callback(tx)) } as any,
      audit as any,
    );

    await expect(timedService.createRandom({ id: 1, role: 'ADMIN' }, {
      examScheduleId: 2,
      paperCode: '001',
      durationMinutes: 90,
      easyCount: 1,
      mediumCount: 0,
      hardCount: 0,
    })).rejects.toBeInstanceOf(BadRequestException);
  });
});
