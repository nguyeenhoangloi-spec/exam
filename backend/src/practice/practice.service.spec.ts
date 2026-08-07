import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PracticeService } from './practice.service';

describe('PracticeService', () => {
  const question = {
    id: 'question-1',
    content: 'Câu hỏi kiểm thử',
    type: 'SINGLE_CHOICE',
    score: 0.25,
    options: [
      { id: 'option-a', label: 'A', content: 'Đúng', isCorrect: true },
      { id: 'option-b', label: 'B', content: 'Sai', isCorrect: false },
    ],
  };

  const createService = () => {
    const prisma = {
      subject: { findUnique: jest.fn().mockResolvedValue({ id: 1, subjectName: 'Cơ sở dữ liệu' }) },
      question: { findMany: jest.fn().mockResolvedValue([question]) },
    };
    return { service: new PracticeService(prisma as any), prisma };
  };

  it('tạo phiên không gửi đáp án đúng ra client và chấm ở server', async () => {
    const { service } = createService();
    const session = await service.generate({ id: 11 }, { subjectId: 1, questionCount: 1, durationMinutes: 30 });

    expect(session.questions).toHaveLength(1);
    expect(session.questions[0].options.every((option) => !Object.prototype.hasOwnProperty.call(option, 'isCorrect'))).toBe(true);

    const correctOptionId = question.options.find((option) => option.isCorrect)!.id;
    const result = service.submit({ id: 11 }, session.sessionId, { answers: { 'question-1': [correctOptionId] } });
    expect(result.totalScore).toBe(0.25);
    expect(result.correctCount).toBe(1);
  });

  it('không cho người khác nộp thay hoặc nộp lại cùng phiên', async () => {
    const { service } = createService();
    const session = await service.generate({ id: 11 }, { subjectId: 1, questionCount: 1 });

    expect(() => service.submit({ id: 12 }, session.sessionId, { answers: {} })).toThrow(NotFoundException);
    service.submit({ id: 11 }, session.sessionId, { answers: {} });
    expect(() => service.submit({ id: 11 }, session.sessionId, { answers: {} })).toThrow(NotFoundException);
  });

  it('từ chối số câu vượt giới hạn trước khi truy vấn dữ liệu', async () => {
    const { service, prisma } = createService();
    await expect(service.generate({ id: 11 }, { subjectId: 1, questionCount: 41 })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.question.findMany).not.toHaveBeenCalled();
  });
});
