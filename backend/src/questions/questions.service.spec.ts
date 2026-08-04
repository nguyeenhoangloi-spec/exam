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
});
