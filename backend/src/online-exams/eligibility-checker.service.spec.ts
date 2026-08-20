import { EligibilityCheckerService, EligibilityErrorCode } from './eligibility-checker.service';

describe('EligibilityCheckerService - access policy by exam mode', () => {
  const examDate = new Date(2026, 7, 20);
  const startTime = '11:00';
  const endTime = '13:00';

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 20, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const student = {
    id: 10,
    userId: 100,
    status: 'ACTIVE',
    user: { id: 100, username: 'student', email: 'student@example.test', role: 'STUDENT', status: 'ACTIVE' },
    studentSubjects: [],
  };

  const createSchedule = (mode: 'OFFICIAL' | 'MOCK') => ({
    id: 1,
    mode,
    status: 'ONGOING',
    examType: 'TRAC_NGHIEM',
    examDate,
    startTime,
    endTime,
    examPeriod: { name: 'Đợt thi kiểm thử', status: 'ACTIVE' },
    subject: { id: 1, subjectCode: 'TEST101', subjectName: 'Kiểm thử' },
    examScheduleRooms: mode === 'OFFICIAL'
      ? [{ room: { roomCode: 'P.101', roomName: 'Phòng 101', building: 'A' }, examRoomStudents: [{ id: 1, status: 'ASSIGNED' }] }]
      : [],
    onlineExamConfig: {
      id: 1,
      examPaper: { id: 1, status: 'PUBLISHED' },
      maxAttempts: 1,
      lateEntryWindowMinutes: 60,
      ipWhitelist: [],
      requireDeviceBinding: false,
      requireWebcam: false,
      accessCode: 'ROOM-ONLY',
      examPasswordHash: 'legacy-mock-password-hash',
    },
  });

  const createService = (mode: 'OFFICIAL' | 'MOCK') => {
    const prisma = {
      student: { findUnique: jest.fn().mockResolvedValue(student) },
      examSchedule: { findFirst: jest.fn().mockResolvedValue(createSchedule(mode)) },
      examAttempt: { findMany: jest.fn().mockResolvedValue([]) },
    };
    return new EligibilityCheckerService(prisma as any);
  };

  it('bắt buộc mật khẩu/mã truy cập với kỳ thi chính thức đã cấu hình', async () => {
    const result = await createService('OFFICIAL').check({ studentUserId: 100, scheduleId: 1 });

    expect(result).toEqual(expect.objectContaining({
      isEligible: false,
      errorCode: EligibilityErrorCode.ACCESS_CODE_REQUIRED,
    }));
  });

  it('bỏ qua mật khẩu/mã truy cập cấu hình cũ với thi thử', async () => {
    const result = await createService('MOCK').check({ studentUserId: 100, scheduleId: 1 });

    expect(result.isEligible).toBe(true);
    expect(result.errorCode).toBeUndefined();
  });
});
