import { ExamReportsService } from './exam-reports.service';
import { ExamReportExportFormat, ExamReportType } from './dto/report-request.dto';

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

  it('công bố danh mục báo cáo chuẩn để frontend không hardcode', () => {
    const service = new ExamReportsService({} as any);
    const catalog = service.getCatalog();

    expect(catalog.map((item) => item.type)).toEqual(expect.arrayContaining([
      ExamReportType.EXAM_SUMMARY,
      ExamReportType.SCORE_DISTRIBUTION,
      ExamReportType.ATTENDANCE,
      ExamReportType.GRADING_PROGRESS,
      ExamReportType.INCIDENTS,
      ExamReportType.GRADE_APPEALS,
    ]));
    expect(catalog.every((item) => item.formats.includes('XLSX'))).toBe(true);
  });

  it('xuất CSV UTF-8 và ghi nhật ký theo đúng phạm vi báo cáo', async () => {
    const prisma: any = { examSchedule: { findMany: jest.fn().mockResolvedValue([]) } };
    const audit: any = { write: jest.fn().mockResolvedValue(undefined) };
    const service = new ExamReportsService(prisma, audit);

    const file = await service.export(
      { id: 9, role: 'ADMIN' },
      { type: ExamReportType.EXAM_SUMMARY, format: ExamReportExportFormat.CSV, filters: {} },
    );

    expect(file.filename).toMatch(/\.csv$/);
    expect(file.buffer.toString('utf8').startsWith('\uFEFF')).toBe(true);
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 9,
      action: 'EXAM_REPORT_EXPORT',
      entityId: ExamReportType.EXAM_SUMMARY,
    }));
  });

  it('tạo workbook XLSX thật thay vì HTML đổi đuôi file', async () => {
    const prisma: any = { examSchedule: { findMany: jest.fn().mockResolvedValue([]) } };
    const service = new ExamReportsService(prisma, { write: jest.fn() } as any);

    const file = await service.export(
      { id: 1, role: 'ADMIN' },
      { type: ExamReportType.EXAM_SUMMARY, format: ExamReportExportFormat.XLSX, filters: {} },
    );

    expect(file.filename).toMatch(/\.xlsx$/);
    expect(file.contentType).toContain('spreadsheetml');
    expect(file.buffer.subarray(0, 2).toString()).toBe('PK');
  });
});
