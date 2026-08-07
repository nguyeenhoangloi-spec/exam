import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

type StoredOption = { id: string; label: string; content: string; isCorrect: boolean };
type StoredQuestion = {
  id: string;
  content: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  score: number;
  options: StoredOption[];
};
type PracticeSession = {
  userId: number;
  subjectName: string;
  expiresAt: number;
  questions: StoredQuestion[];
};

@Injectable()
export class PracticeService {
  private readonly sessions = new Map<string, PracticeSession>();
  private readonly sessionTtlMs = 45 * 60 * 1000;

  constructor(private readonly prisma: PrismaService) {}

  async generate(user: { id: number }, input: { subjectId?: number; questionCount?: number; durationMinutes?: number }) {
    const subjectId = Number(input.subjectId);
    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      throw new BadRequestException('Môn học không hợp lệ.');
    }

    const requestedCount = Number(input.questionCount);
    if (!Number.isInteger(requestedCount) || requestedCount < 1 || requestedCount > 40) {
      throw new BadRequestException('Số câu luyện tập phải từ 1 đến 40.');
    }

    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, subjectName: true },
    });
    if (!subject) throw new NotFoundException('Không tìm thấy môn học.');

    const candidates = await this.prisma.question.findMany({
      where: {
        subjectId,
        status: 'APPROVED',
        isActive: true,
        deletedAt: null,
        type: { in: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'] },
      },
      select: {
        id: true,
        content: true,
        type: true,
        score: true,
        options: {
          orderBy: { order: 'asc' },
          select: { id: true, label: true, content: true, isCorrect: true },
        },
      },
      take: 500,
    });

    const validQuestions = candidates.filter((question) => {
      const correctCount = question.options.filter((option) => option.isCorrect).length;
      return question.options.length >= 2 && correctCount >= 1;
    });
    if (!validQuestions.length) {
      throw new BadRequestException('Môn học này chưa có câu hỏi trắc nghiệm đã duyệt để luyện tập.');
    }

    const questions = this.shuffle(validQuestions)
      .slice(0, Math.min(requestedCount, validQuestions.length))
      .map((question) => ({ ...question, options: this.shuffle(question.options) })) as StoredQuestion[];
    const sessionId = randomUUID();
    const expiresAt = Date.now() + this.sessionTtlMs;
    this.cleanupExpiredSessions();
    this.sessions.set(sessionId, { userId: user.id, subjectName: subject.subjectName, expiresAt, questions });

    return {
      sessionId,
      title: `Luyện tập: ${subject.subjectName}`,
      questionCount: questions.length,
      durationMinutes: Math.max(1, Math.min(Number(input.durationMinutes) || 30, 90)),
      expiresAt: new Date(expiresAt).toISOString(),
      questions: questions.map((question) => ({
        id: question.id,
        content: question.content,
        type: question.type,
        options: question.options.map(({ id, label, content }) => ({ id, label, content })),
      })),
    };
  }

  submit(user: { id: number }, sessionId: string, input: { answers?: Record<string, string[]> }) {
    const session = this.sessions.get(sessionId);
    if (!session || session.expiresAt <= Date.now()) {
      this.sessions.delete(sessionId);
      throw new NotFoundException('Phiên luyện tập không tồn tại hoặc đã hết hạn. Vui lòng tạo bài mới.');
    }
    if (session.userId !== user.id) {
      throw new NotFoundException('Không tìm thấy phiên luyện tập của bạn.');
    }

    const answers = input.answers || {};
    let totalScore = 0;
    const details = session.questions.map((question) => {
      const selected = Array.from(new Set((answers[question.id] || []).filter((value) => typeof value === 'string'))).sort();
      const correct = question.options.filter((option) => option.isCorrect).map((option) => option.id).sort();
      const isCorrect = selected.length === correct.length && selected.every((value, index) => value === correct[index]);
      const earnedScore = isCorrect ? question.score : 0;
      totalScore += earnedScore;
      return { questionId: question.id, isCorrect, earnedScore, maxScore: question.score };
    });
    this.sessions.delete(sessionId);

    return {
      title: session.subjectName,
      totalScore: Number(totalScore.toFixed(2)),
      maxScore: Number(session.questions.reduce((sum, question) => sum + question.score, 0).toFixed(2)),
      correctCount: details.filter((detail) => detail.isCorrect).length,
      questionCount: details.length,
      details,
    };
  }

  private cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) this.sessions.delete(sessionId);
    }
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }
}
