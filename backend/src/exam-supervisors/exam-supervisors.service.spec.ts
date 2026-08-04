import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ExamSupervisorsService } from './exam-supervisors.service';

describe('ExamSupervisorsService integrity rules', () => {
  it('không phân công cho lịch đã hủy và dùng transaction serializable', async () => {
    const tx: any = {
      teacher: {
        findUnique: jest.fn().mockResolvedValue({ id: 2, fullName: 'Giảng viên A', user: { status: 'ACTIVE' } }),
      },
      examScheduleRoom: {
        findUnique: jest.fn().mockResolvedValue({
          id: 3,
          room: {},
          supervisors: [],
          examSchedule: { status: 'CANCELLED' },
        }),
      },
    };
    const prisma: any = { $transaction: jest.fn((callback: (client: unknown) => unknown) => callback(tx)) };
    const service = new ExamSupervisorsService(prisma, { write: jest.fn() } as any);

    await expect(service.assign({ id: 1 }, { examScheduleRoomId: 3, teacherId: 2 })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  });
});
