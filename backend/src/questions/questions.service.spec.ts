import { BadRequestException } from '@nestjs/common';
import { QuestionsService } from './questions.service';

describe('QuestionsService integrity rules', () => {
  it('không cho sửa câu hỏi đã được đưa vào đề thi', async () => {
    const prisma: any = {
      question: {
        findFirst: jest.fn().mockResolvedValue({
          id: '8f46be8b-bf3e-4b9e-b83a-7f5e8756e4c2',
          createdById: 1,
          status: 'DRAFT',
          options: [],
          statistic: { usedCount: 1 },
        }),
      },
      examPaperQuestion: { count: jest.fn().mockResolvedValue(1) },
    };
    const service = new QuestionsService(prisma, { write: jest.fn() } as any);

    await expect(service.update(
      { id: 1, role: 'ADMIN' },
      '8f46be8b-bf3e-4b9e-b83a-7f5e8756e4c2',
      { content: 'Nội dung đã chỉnh sửa' } as any,
    )).rejects.toBeInstanceOf(BadRequestException);
  });

  it('giới hạn ngân hàng câu hỏi của giảng viên theo khoa', async () => {
    const prisma: any = {
      teacher: { findUnique: jest.fn().mockResolvedValue({ departmentId: 4 }) },
      question: {
        findMany: jest.fn().mockResolvedValue([{
          id: 'question-1',
          explanation: 'Giải thích đáp án',
          options: [{ id: 'option-1', content: 'A', isCorrect: true }],
          fillBlankAnswers: [{ blankIndex: 1, answer: 'bí mật', acceptedAnswers: ['secret'], score: 1 }],
        }]),
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest.fn((operations) => Promise.all(operations)),
    };
    const service = new QuestionsService(prisma, { write: jest.fn() } as any);

    const result = await service.findAll({ id: 7, role: 'TEACHER' }, {} as any);

    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ subject: { departmentId: 4 } }),
      }),
    );
    expect(prisma.question.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ subject: { departmentId: 4 } }),
    });
    expect(JSON.stringify(result)).not.toContain('isCorrect');
    expect(JSON.stringify(result)).not.toContain('bí mật');
    expect(JSON.stringify(result)).not.toContain('Giải thích đáp án');
  });

  it('không truy vấn chi tiết câu hỏi ngoài khoa của giảng viên', async () => {
    const prisma: any = {
      teacher: { findUnique: jest.fn().mockResolvedValue({ departmentId: 4 }) },
      question: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new QuestionsService(prisma, { write: jest.fn() } as any);

    await expect(service.findOne({ id: 7, role: 'TEACHER' }, 'question-1')).rejects.toThrow('Không tìm thấy câu hỏi.');
    expect(prisma.question.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'question-1', deletedAt: null, subject: { departmentId: 4 } },
      }),
    );
  });

  it('tự động đồng bộ question_code_seq khi khởi tạo module', async () => {
    const prisma: any = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      $queryRaw: jest.fn().mockResolvedValue([{ max_num: BigInt(42) }]),
    };
    const service = new QuestionsService(prisma, { write: jest.fn() } as any);

    await service.onModuleInit();

    expect(prisma.$executeRaw).toHaveBeenCalled();
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.$queryRaw.mock.calls[0][0].join('')).toContain("regexp_replace(code, '[^0-9]', '', 'g')");
  });
});
