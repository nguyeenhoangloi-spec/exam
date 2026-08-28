import { Test, TestingModule } from '@nestjs/testing';
import { ExamArchivesService } from './exam-archives.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccessPolicyService } from '../access-control/access-policy.service';

describe('ExamArchivesService', () => {
  let service: ExamArchivesService;
  let prisma: any;
  let audit: any;
  let accessPolicy: any;

  beforeEach(async () => {
    prisma = {
      examSchedule: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            examDate: new Date('2026-06-15'),
            startTime: '08:00',
            endTime: '09:30',
            examType: 'TRAC_NGHIEM',
            examPeriod: { name: 'Kỳ thi Học kỳ 2', semester: 'HK2', schoolYear: '2025-2026' },
            subject: { subjectCode: 'IT4409', subjectName: 'Lập trình Web Nâng cao', department: { name: 'CNTT' } },
            onlineExamConfig: {
              examPaper: { id: 10, paperCode: 'WEB-01', title: 'Đề thi Web' },
              _count: { attempts: 45 },
            },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          subjectId: 101,
          deletedAt: null,
          subject: { subjectCode: 'IT4409', subjectName: 'Lập trình Web' },
          examPeriod: { name: 'Học kỳ 2' },
          onlineExamConfig: { id: 99, examPaperId: 10 },
        }),
      },
      examAttempt: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where?.totalScore) return Promise.resolve(40);
          if (where?.isFlagged) return Promise.resolve(2);
          return Promise.resolve(45);
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'attempt-uuid-1',
            totalScore: 8.5,
            maxScore: 10,
            submittedAt: new Date('2026-06-15T09:15:00Z'),
            publishedAt: new Date('2026-06-16T10:00:00Z'),
            isFlagged: false,
            penaltyPoints: 0,
            student: { studentCode: 'SV001', fullName: 'Nguyễn Văn A', class: { name: 'CNTT-K65' } },
            gradedBy: { id: 2, username: 'teacher1' },
            approvedBy: { id: 1, username: 'admin' },
          },
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'attempt-uuid-1',
          startTime: new Date('2026-06-15T08:00:00Z'),
          submittedAt: new Date('2026-06-15T09:15:00Z'),
          publishedAt: new Date('2026-06-16T10:00:00Z'),
          totalScore: 8.5,
          maxScore: 10,
          penaltyPoints: 0,
          penaltyReason: null,
          isFlagged: false,
          student: {
            id: 1,
            studentCode: 'SV001',
            fullName: 'Nguyễn Văn A',
            userId: 100,
            class: { name: 'CNTT-K65', department: { name: 'CNTT' } },
          },
          onlineExamConfig: {
            examSchedule: {
              subjectId: 101,
              subject: { subjectCode: 'IT4409', subjectName: 'Lập trình Web' },
              examPeriod: { name: 'Học kỳ 2' },
              examDate: new Date('2026-06-15'),
              startTime: '08:00',
              endTime: '09:30',
            },
            examPaper: { paperCode: 'WEB-01', title: 'Đề thi chính thức' },
          },
          snapshot: {
            paperTitle: 'Đề thi Web',
            duration: 60,
            snapshotData: [
              {
                id: 'q1',
                code: 'Q1',
                type: 'SINGLE_CHOICE',
                content: 'SSR là gì?',
                score: 1.0,
                options: [
                  { id: 'opt1', label: 'A', content: 'Server Side Rendering', isCorrect: true },
                  { id: 'opt2', label: 'B', content: 'Client Side Rendering', isCorrect: false },
                ],
              },
            ],
          },
          attemptAnswers: [
            {
              questionId: 'q1',
              selectedOptionIds: ['opt1'],
              textAnswer: null,
              finalScore: 1.0,
              teacherComment: 'Tốt',
              submissionFiles: [],
            },
          ],
          proctoringEvents: [],
          incidents: [],
          gradedBy: { username: 'teacher1' },
          approvedBy: { username: 'admin' },
        }),
      },
    };

    audit = {
      write: jest.fn().mockResolvedValue(undefined),
    };

    accessPolicy = {
      allowedSubjectIds: jest.fn().mockResolvedValue(null),
      assertSubjectScope: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamArchivesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: AccessPolicyService, useValue: accessPolicy },
      ],
    }).compile();

    service = module.get<ExamArchivesService>(ExamArchivesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compute consistent SHA-256 seal hash', () => {
    const hash1 = service.generateSealHash({
      id: 'att-1',
      studentCode: 'SV001',
      paperCode: 'P01',
      submittedAt: new Date('2026-06-15T09:00:00Z'),
      totalScore: 9.0,
      publishedAt: new Date('2026-06-16T10:00:00Z'),
    });

    const hash2 = service.generateSealHash({
      id: 'att-1',
      studentCode: 'SV001',
      paperCode: 'P01',
      submittedAt: new Date('2026-06-15T09:00:00Z'),
      totalScore: 9.0,
      publishedAt: new Date('2026-06-16T10:00:00Z'),
    });

    expect(hash1).toHaveLength(64);
    expect(hash1).toEqual(hash2);
  });

  it('should return summary stats correctly', async () => {
    const summary = await service.getArchiveSummary({ id: 1, role: 'ADMIN' });
    expect(summary.totalArchivedSchedules).toBe(5);
    expect(summary.totalArchivedAttempts).toBe(45);
    expect(summary.passedAttempts).toBe(40);
    expect(summary.failedAttempts).toBe(5);
    expect(summary.passRate).toBe(88.9);
    expect(summary.retainedCount).toBeDefined();
    expect(summary.disposalEligibleCount).toBeDefined();
  });

  it('should verify integrity successfully', async () => {
    const res = await service.verifyAttemptIntegrity({ id: 1, role: 'ADMIN' }, 'attempt-uuid-1');
    expect(res.success).toBe(true);
    expect(res.isTamperProof).toBe(true);
    expect(res.verifiedHash).toHaveLength(64);
    expect(audit.write).toHaveBeenCalled();
  });

  it('should compute retention info correctly for schedules within and beyond 2 years', () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 6);
    const recentRetention = service.generateSealHash ? require('./exam-archives.service').computeRetentionInfo(recentDate) : null;
    expect(recentRetention.retentionStatus).toBe('RETAINED');
    expect(recentRetention.isEligibleForDisposal).toBe(false);

    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 3);
    const oldRetention = require('./exam-archives.service').computeRetentionInfo(oldDate);
    expect(oldRetention.retentionStatus).toBe('ELIGIBLE_FOR_DISPOSAL');
    expect(oldRetention.isEligibleForDisposal).toBe(true);
  });

  it('should return disposal proposal template with regulations', async () => {
    const proposal = await service.getDisposalProposal({ id: 1, role: 'ADMIN' }, 1);
    expect(proposal.proposalCode).toContain('BBTH-IT4409-1');
    expect(proposal.regulations.length).toBeGreaterThanOrEqual(3);
    expect(proposal.councilMembers.length).toBe(5);
  });

  it('should support dynamic retention years and enforce minimum 2 years guardrail', async () => {
    const { computeRetentionInfo } = require('./exam-archives.service');
    const { ExamArchivesConfigService } = require('./exam-archives-config.service');

    const testDate = new Date();
    testDate.setFullYear(testDate.getFullYear() - 3); // 3 years ago

    // With default 2 years: 3 years ago is eligible for disposal
    const res2Years = computeRetentionInfo(testDate, 2);
    expect(res2Years.isEligibleForDisposal).toBe(true);
    expect(res2Years.retentionYears).toBe(2);

    // With 5 years: 3 years ago is STILL RETAINED!
    const res5Years = computeRetentionInfo(testDate, 5);
    expect(res5Years.isEligibleForDisposal).toBe(false);
    expect(res5Years.retentionStatus).toBe('RETAINED');
    expect(res5Years.retentionYears).toBe(5);

    // Config service guardrail tests
    const configService = new ExamArchivesConfigService();
    await expect(configService.updateConfig({ retentionYears: 1 }, { id: 1, username: 'admin' }))
      .rejects.toThrow('tối thiểu là 02 năm');
    await expect(configService.updateConfig({ retentionYears: 15 }, { id: 1, username: 'admin' }))
      .rejects.toThrow('tối đa có thể thiết lập là 10 năm');
  });
});
