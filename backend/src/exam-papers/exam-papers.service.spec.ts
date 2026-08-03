import { ForbiddenException } from '@nestjs/common';
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
    expect(call.where).toEqual({ deletedAt: null });
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
});
