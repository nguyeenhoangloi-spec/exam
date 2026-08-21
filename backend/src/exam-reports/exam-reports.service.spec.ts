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
        mode: 'OFFICIAL',
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
      where: { deletedAt: null, mode: 'OFFICIAL' },
    }));
  });

  it('tách bài đã chấm khỏi bài đã nộp khi tính tỷ lệ đạt', async () => {
    const prisma: any = {
      examSchedule: {
        findMany: jest.fn().mockResolvedValue([{
          id: 10,
          examPeriodId: 2,
          examDate: new Date('2026-08-20T00:00:00.000Z'),
          subject: {
            id: 3,
            subjectCode: 'CS101',
            subjectName: 'Cơ sở dữ liệu',
            departmentId: 4,
            department: { id: 4, name: 'Công nghệ thông tin' },
          },
          examPeriod: { id: 2, name: 'Học kỳ I' },
          examScheduleRooms: [{
            examRoomStudents: [
              { studentId: 11, student: { classId: 5, class: { id: 5, name: 'CNTT-K65' } } },
              { studentId: 12, student: { classId: 5, class: { id: 5, name: 'CNTT-K65' } } },
            ],
          }],
        }]),
      },
      examAttempt: {
        findMany: jest.fn().mockResolvedValue([
          {
            studentId: 11,
            status: 'SUBMITTED',
            totalScore: 8,
            gradingStatus: 'PUBLISHED',
            isFlagged: false,
            riskScore: 0,
            incidents: [],
            onlineExamConfig: { examScheduleId: 10 },
          },
          {
            studentId: 12,
            status: 'SUBMITTED',
            totalScore: null,
            gradingStatus: 'UNDER_GRADING',
            isFlagged: false,
            riskScore: 0,
            incidents: [],
            onlineExamConfig: { examScheduleId: 10 },
          },
        ]),
      },
    };

    const service = new ExamReportsService(prisma);
    const result = await service.getSummary({ id: 1, role: 'ADMIN' }, {});

    expect(prisma.examAttempt.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ mode: 'OFFICIAL' }),
    }));
    expect(result.stats.totalSubmitted).toBe(2);
    expect(result.stats.totalGraded).toBe(1);
    expect(result.stats.totalUngraded).toBe(1);
    expect(result.stats.passCount).toBe(1);
    expect(result.stats.passRate).toBe(100);
    expect(result.schedules[0].graded).toBe(1);
  });
});
