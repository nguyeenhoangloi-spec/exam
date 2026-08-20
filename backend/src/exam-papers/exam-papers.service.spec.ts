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
  const actionVerifier = { verify: jest.fn().mockResolvedValue(true) };
  const service = new ExamPapersService(prisma as any, audit as any, actionVerifier as any);

  beforeEach(() => jest.clearAllMocks());

  it('giới hạn danh sách TEACHER chỉ theo người tạo', async () => {
    prisma.examPaper.findMany.mockResolvedValue([]);
    await service.findAll({ id: 7, role: 'TEACHER' }, 2);

    expect(prisma.examPaper.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          examScheduleId: 2,
          createdById: 7,
          examSchedule: { deletedAt: null },
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

  it('không trả hash mật khẩu ca thi ra API danh sách đề', async () => {
    prisma.examPaper.findMany.mockResolvedValue([{
      id: 1,
      examSchedule: {
        id: 2,
        onlineExamConfig: { id: 3, examPasswordHash: 'bcrypt-secret-hash' },
      },
    }]);

    const result = await service.findAll({ id: 1, role: 'ADMIN' });

    expect(result[0].hasExamPassword).toBe(true);
    expect(result[0].examSchedule.onlineExamConfig).toEqual({ id: 3 });
    expect(JSON.stringify(result)).not.toContain('bcrypt-secret-hash');
  });

  it('không cho TEACHER xem đề bản nháp của người khác', async () => {
    prisma.examPaper.findFirst.mockResolvedValue({
      id: 1,
      createdById: 99,
      paperCode: '001',
      status: 'DRAFT',
    });

    await expect(service.findOne({ id: 7, role: 'TEACHER' }, 1)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('không cho TEACHER xem đáp án của đề đã phát hành do người khác tạo', async () => {
    prisma.examPaper.findFirst.mockResolvedValue({
      id: 2,
      createdById: 99,
      paperCode: '002',
      status: 'PUBLISHED',
    });

    await expect(service.findOne({ id: 7, role: 'TEACHER' }, 2)).rejects.toBeInstanceOf(ForbiddenException);
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
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const timedService = new ExamPapersService(
      { $transaction: jest.fn((callback) => callback(tx)) } as any,
      audit as any,
      actionVerifier as any,
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

  it('không phát hành đề khi lịch thi chưa được xếp phòng', async () => {
    prisma.examPaper.findFirst.mockResolvedValue({
      id: 10,
      paperCode: 'P-10',
      status: 'DRAFT',
      examScheduleId: 20,
      examSchedule: { mode: 'PRACTICE' },
      questions: [],
    });
    (prisma as any).examSchedule = {
      findFirst: jest.fn().mockResolvedValue({ id: 20, examScheduleRooms: [] }),
    };

    await expect(service.publish({ id: 1, role: 'ADMIN' }, 10)).rejects.toThrow('chưa được xếp phòng');
  });

  it('không phát hành đề khi bất kỳ phòng nào chưa đủ hai giám thị', async () => {
    prisma.examPaper.findFirst.mockResolvedValue({
      id: 11,
      paperCode: 'P-11',
      status: 'DRAFT',
      examScheduleId: 21,
      examSchedule: { mode: 'PRACTICE' },
      questions: [],
    });
    (prisma as any).examSchedule = {
      findFirst: jest.fn().mockResolvedValue({
        id: 21,
        examScheduleRooms: [{ room: { roomCode: 'P.101' }, supervisors: [{ id: 1 }] }],
      }),
    };

    await expect(service.publish({ id: 1, role: 'ADMIN' }, 11)).rejects.toThrow('P.101 chưa đủ 2 giám thị');
  });

  it('cho phép phát hành thi thử không cần phòng và giám thị', async () => {
    const mockSchedule = { id: 30, mode: 'MOCK', examScheduleRooms: [] };
    const tx: any = {
      examSchedule: { findFirst: jest.fn().mockResolvedValue(mockSchedule) },
      examPaper: { update: jest.fn().mockResolvedValue({ id: 12, status: 'PUBLISHED' }) },
      onlineExamConfig: { upsert: jest.fn().mockResolvedValue({ id: 1 }) },
    };
    const mockPrisma = {
      examPaper: {
        findFirst: jest.fn().mockResolvedValue({
          id: 12,
          paperCode: 'P-MOCK',
          status: 'DRAFT',
          examScheduleId: 30,
          examSchedule: { mode: 'MOCK' },
          questions: [],
        }),
      },
      examSchedule: { findFirst: jest.fn().mockResolvedValue(mockSchedule) },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const mockAudit = { write: jest.fn().mockResolvedValue(undefined) };
    const mockService = new ExamPapersService(mockPrisma as any, mockAudit as any, actionVerifier as any);

    await expect(mockService.publish({ id: 1, role: 'ADMIN' }, 12)).resolves.toEqual({ id: 12, status: 'PUBLISHED' });
    expect(mockPrisma.examSchedule.findFirst).toHaveBeenCalled();
    expect(tx.examSchedule.findFirst).toHaveBeenCalled();
  });
});
