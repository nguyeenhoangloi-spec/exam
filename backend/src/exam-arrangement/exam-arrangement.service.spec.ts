import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ExamArrangementService } from './exam-arrangement.service';

describe('ExamArrangementService transaction safety', () => {
  it('thực hiện kiểm tra và xếp phòng trong transaction serializable', async () => {
    const tx: any = {
      examSchedule: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const prisma: any = {
      $transaction: jest.fn((callback: (client: unknown) => unknown) => callback(tx)),
    };
    const service = new ExamArrangementService(prisma, { write: jest.fn() } as any);

    await expect(service.autoArrange({ id: 1 }, 999, [1])).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  });

  it('không xếp phòng cho lịch thi đã hủy', async () => {
    const tx: any = {
      examSchedule: {
        findUnique: jest.fn().mockResolvedValue({ id: 5, status: 'CANCELLED' }),
      },
    };
    const prisma: any = {
      $transaction: jest.fn((callback: (client: unknown) => unknown) => callback(tx)),
    };
    const service = new ExamArrangementService(prisma, { write: jest.fn() } as any);

    await expect(service.autoArrange({ id: 1 }, 5, [1])).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.examSchedule.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 5 } }));
  });
});
