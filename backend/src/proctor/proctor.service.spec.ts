import { ForbiddenException } from '@nestjs/common';
import { ProctorService } from './proctor.service';

describe('ProctorService permissions', () => {
  const prisma = {
    examAttempt: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    examScheduleRoom: {
      findFirst: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };
  const service = new ProctorService(prisma as any);

  const attempt = {
    id: 'attempt-1',
    studentId: 17,
    status: 'IN_PROGRESS',
    expectedEndTime: new Date('2026-08-16T10:00:00.000Z'),
    extraMinutes: 0,
    onlineExamConfig: { examScheduleId: 22 },
  };

  beforeEach(() => jest.clearAllMocks());

  it('từ chối giảng viên chưa được phân công thao tác lên phiên thi', async () => {
    prisma.examAttempt.findUnique.mockResolvedValue(attempt);
    prisma.examScheduleRoom.findFirst.mockResolvedValue(null);

    await expect(
      service.extendTime(501, 'TEACHER', 'attempt-1', 5, 'Sự cố mạng'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.examAttempt.update).not.toHaveBeenCalled();
  });

  it('cho phép giảng viên được phân công và ghi nhận gia hạn', async () => {
    prisma.examAttempt.findUnique.mockResolvedValue(attempt);
    prisma.examScheduleRoom.findFirst.mockResolvedValue({ id: 7 });
    prisma.examAttempt.update.mockResolvedValue({
      ...attempt,
      expectedEndTime: new Date('2026-08-16T10:05:00.000Z'),
      extraMinutes: 5,
    });

    await expect(
      service.extendTime(501, 'TEACHER', 'attempt-1', 5, 'Sự cố mạng'),
    ).resolves.toEqual(expect.objectContaining({ success: true }));
    expect(prisma.examScheduleRoom.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          examScheduleId: 22,
          examRoomStudents: { some: { studentId: 17 } },
          supervisors: { some: { teacher: { userId: 501 } } },
        }),
      }),
    );
    expect(prisma.examAttempt.update).toHaveBeenCalled();
  });

  it('cho phép Admin xử lý mà không yêu cầu phân công giám thị', async () => {
    prisma.examAttempt.findUnique.mockResolvedValue(attempt);
    prisma.examAttempt.update.mockResolvedValue({
      ...attempt,
      expectedEndTime: new Date('2026-08-16T10:05:00.000Z'),
      extraMinutes: 5,
    });

    await expect(
      service.extendTime(1, 'ADMIN', 'attempt-1', 5, 'Xử lý sự cố'),
    ).resolves.toEqual(expect.objectContaining({ success: true }));
    expect(prisma.examScheduleRoom.findFirst).not.toHaveBeenCalled();
  });
});
