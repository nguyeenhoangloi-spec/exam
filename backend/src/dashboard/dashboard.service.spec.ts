import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const prisma = {
    student: { count: jest.fn() },
    teacher: { count: jest.fn() },
    subject: { count: jest.fn() },
    examRoom: { count: jest.fn() },
    class: { count: jest.fn() },
    examSchedule: { count: jest.fn(), findMany: jest.fn() },
    question: { count: jest.fn(), groupBy: jest.fn(), findMany: jest.fn() },
    examPeriod: { findMany: jest.fn() },
    auditLog: { findMany: jest.fn() },
    $queryRaw: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.student.count.mockResolvedValue(4);
    prisma.teacher.count.mockResolvedValue(2);
    prisma.subject.count.mockResolvedValue(2);
    prisma.examRoom.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
    prisma.class.count.mockResolvedValue(2);
    prisma.examSchedule.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    prisma.question.count.mockResolvedValue(1);
    prisma.$queryRaw.mockResolvedValue([]);
    prisma.question.groupBy.mockResolvedValue([
      { status: 'DRAFT', _count: { _all: 3 } },
      { status: 'PENDING', _count: { _all: 1 } },
    ]);
    prisma.examSchedule.findMany.mockResolvedValue([{
      id: 10,
      examDate: new Date('2099-08-10T00:00:00.000Z'),
      startTime: '08:00',
      endTime: '09:30',
      status: 'SCHEDULED',
      examPeriod: { name: 'Kỳ thi cuối kỳ' },
      subject: { subjectCode: 'CNTT01', subjectName: 'Công nghệ thông tin' },
      examScheduleRooms: [{
        room: { roomCode: 'A101' },
        _count: { examRoomStudents: 24 },
      }],
    }]);
    prisma.question.findMany.mockResolvedValue([{
      id: 'question-1',
      code: 'Q000001',
      content: 'Nội dung câu hỏi',
      difficulty: 'EASY',
      updatedAt: new Date('2026-08-03T08:00:00.000Z'),
      createdById: 2,
      subject: { subjectCode: 'CNTT01', subjectName: 'Công nghệ thông tin' },
      chapter: { code: 'CH1', name: 'Chương 1' },
      createdBy: { id: 2, username: 'teacher1', role: 'TEACHER' },
    }]);
    prisma.examPeriod.findMany.mockResolvedValue([{
      id: 1,
      name: 'Kỳ thi cuối kỳ',
      status: 'UPCOMING',
      examSchedules: [{
        id: 10,
        examScheduleRooms: [{ _count: { examRoomStudents: 24, supervisors: 1 } }],
        _count: { examPapers: 0 },
      }],
    }]);
    prisma.auditLog.findMany.mockResolvedValue([]);
  });

  it('trả đủ sáu tháng, năm trạng thái và không lộ đáp án câu hỏi', async () => {
    const service = new DashboardService(prisma as any);
    const result = await service.overview();

    expect(result.examChart).toHaveLength(6);
    expect(result.questionStatus).toHaveLength(5);
    expect(result.questionStatus.find((item) => item.status === 'ARCHIVED')?.count).toBe(0);
    expect(result.upcomingExams).toHaveLength(1);
    expect(result.upcomingExams[0].studentCount).toBe(24);
    expect(result.upcomingExams[0].roomCodes).toEqual(['A101']);
    expect(result.pendingQuestions).toHaveLength(1);
    expect(result.pendingQuestions[0]).not.toHaveProperty('options');
  });

  it('tính đúng tiến độ theo lịch, phòng, giám thị và đề thi', async () => {
    const service = new DashboardService(prisma as any);
    const result = await service.overview();

    expect(result.examProgress[0]).toMatchObject({
      roomProgress: 100,
      supervisorProgress: 100,
      paperProgress: 0,
      incompleteSchedules: 1,
    });
  });
});
