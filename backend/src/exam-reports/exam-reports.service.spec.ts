import { ExamReportsService } from './exam-reports.service';

describe('ExamReportsService permissions', () => {
  it('giới hạn báo cáo của TEACHER theo phòng được phân công', async () => {
    const prisma: any = {
      examSchedule: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new ExamReportsService(prisma);

    await service.getSummary({ id: 7, role: 'TEACHER' }, {});

    expect(prisma.examSchedule.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        AND: expect.arrayContaining([
          { examScheduleRooms: { some: { supervisors: { some: { teacher: { userId: 7 } } } } } },
        ]),
      }),
    }));
  });

  it('không thêm bộ lọc phân công cho Admin', async () => {
    const prisma: any = {
      examSchedule: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new ExamReportsService(prisma);

    await service.getSummary({ id: 1, role: 'ADMIN' }, {});

    expect(prisma.examSchedule.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletedAt: null },
    }));
  });
});
