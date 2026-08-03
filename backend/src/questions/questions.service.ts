import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { subjectId?: number; chapter?: number; difficulty?: string; status?: string }) {
    const where: any = {};
    if (query?.subjectId) where.subjectId = Number(query.subjectId);
    if (query?.chapter) where.chapter = Number(query.chapter);
    if (query?.difficulty) where.difficulty = query.difficulty;
    if (query?.status) where.status = query.status;

    return this.prisma.question.findMany({
      where,
      include: {
        subject: true,
        options: true,
        createdBy: { select: { id: true, username: true, role: true } },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        subject: true,
        options: true,
        createdBy: { select: { id: true, username: true, role: true } },
      },
    });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi.');
    return question;
  }

  async create(
    userId: number,
    data: {
      subjectId: number;
      chapter: number;
      content: string;
      questionType?: string;
      difficulty?: string;
      score?: number;
      explanation?: string;
      options: { optionLabel: string; optionContent: string; isCorrect: boolean }[];
    },
  ) {
    // 1. Kiểm tra options >= 2
    if (!data.options || data.options.length < 2) {
      throw new BadRequestException('Câu hỏi trắc nghiệm phải có ít nhất 2 phương án lựa chọn.');
    }

    const questionType = data.questionType || 'SINGLE_CHOICE';

    // 2. Nếu SINGLE_CHOICE, chỉ có đúng 1 đáp án đúng
    if (questionType === 'SINGLE_CHOICE') {
      const correctCount = data.options.filter((opt) => opt.isCorrect).length;
      if (correctCount !== 1) {
        throw new BadRequestException('Câu hỏi chọn 1 đáp án (SINGLE_CHOICE) phải có duy nhất 1 đáp án đúng.');
      }
    }

    // 3. Môn học tồn tại
    const subject = await this.prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) throw new NotFoundException('Môn học không tồn tại.');

    return this.prisma.question.create({
      data: {
        subjectId: data.subjectId,
        chapter: data.chapter || 1,
        content: data.content,
        questionType,
        difficulty: data.difficulty || 'MEDIUM',
        score: data.score || 0.25,
        explanation: data.explanation,
        status: 'PENDING',
        createdById: userId,
        options: {
          create: data.options.map((opt) => ({
            optionLabel: opt.optionLabel,
            optionContent: opt.optionContent,
            isCorrect: opt.isCorrect || false,
          })),
        },
      },
      include: {
        subject: true,
        options: true,
      },
    });
  }

  async bulkCreate(userId: number, rows: any[]) {
    const subjects = await this.prisma.subject.findMany();
    const subjectMap = new Map(subjects.map((s) => [s.subjectCode.toLowerCase(), s]));
    const valid: any[] = [], errors: any[] = [];
    const seen = new Set<string>();
    rows.forEach((row, i) => {
      const line = i + 2;
      const subject = subjectMap.get(String(row.subjectCode || '').trim().toLowerCase()) ||
        subjects.find((s) => s.subjectName.toLowerCase() === String(row.subjectName || '').trim().toLowerCase());
      const options = ['A', 'B', 'C', 'D'].map((label) => String(row[label] || '').trim());
      const correct = String(row.correctAnswer || '').trim().toUpperCase();
      const key = String(row.content || '').trim().toLowerCase();
      const rowErrors: string[] = [];
      if (!subject) rowErrors.push('Môn học không tồn tại (dùng subjectCode hoặc subjectName)');
      if (!key) rowErrors.push('Thiếu nội dung câu hỏi');
      if (options.some((o) => !o)) rowErrors.push('Thiếu một trong các đáp án A/B/C/D');
      if (!['A', 'B', 'C', 'D'].includes(correct)) rowErrors.push('Đáp án đúng phải là A, B, C hoặc D');
      if (!['EASY', 'MEDIUM', 'HARD'].includes(String(row.difficulty || 'MEDIUM').toUpperCase())) rowErrors.push('Độ khó không hợp lệ');
      if (seen.has(key)) rowErrors.push('Trùng câu hỏi trong file');
      if (rowErrors.length) errors.push({ line, errors: rowErrors });
      else { seen.add(key); valid.push({ subjectId: subject!.id, chapter: Number(row.chapter || 1), content: String(row.content).trim(), difficulty: String(row.difficulty || 'MEDIUM').toUpperCase(), score: Number(row.score || 0.25), explanation: row.explanation ? String(row.explanation) : undefined, options: options.map((content, j) => ({ optionLabel: ['A','B','C','D'][j], optionContent: content, isCorrect: correct === ['A','B','C','D'][j] })) }); }
    });
    const duplicates = await this.prisma.question.findMany({ where: { content: { in: valid.map((v) => v.content) } }, select: { content: true } });
    const duplicateSet = new Set(duplicates.map((q) => q.content.trim().toLowerCase()));
    const toCreate = valid.filter((v) => !duplicateSet.has(v.content.trim().toLowerCase()));
    valid.forEach((v, i) => { if (duplicateSet.has(v.content.trim().toLowerCase())) errors.push({ line: i + 2, errors: ['Câu hỏi đã tồn tại trong ngân hàng'] }); });
    await this.prisma.$transaction(toCreate.map((data) => this.prisma.question.create({ data: { ...data, status: 'PENDING', createdById: userId, options: { create: data.options } } })));
    return { imported: toCreate.length, errors };
  }

  async update(id: number, data: any) {
    await this.findOne(id);

    if (data.options) {
      if (data.options.length < 2) {
        throw new BadRequestException('Câu hỏi trắc nghiệm phải có ít nhất 2 phương án lựa chọn.');
      }
      const questionType = data.questionType || 'SINGLE_CHOICE';
      if (questionType === 'SINGLE_CHOICE') {
        const correctCount = data.options.filter((opt: any) => opt.isCorrect).length;
        if (correctCount !== 1) {
          throw new BadRequestException('Câu hỏi chọn 1 đáp án phải có đúng 1 đáp án đúng.');
        }
      }

      // Re-create options
      await this.prisma.questionOption.deleteMany({ where: { questionId: id } });
    }

    const { options, ...questionData } = data;

    return this.prisma.question.update({
      where: { id },
      data: {
        ...questionData,
        options: options
          ? {
              create: options.map((opt: any) => ({
                optionLabel: opt.optionLabel,
                optionContent: opt.optionContent,
                isCorrect: opt.isCorrect || false,
              })),
            }
          : undefined,
      },
      include: { subject: true, options: true },
    });
  }

  async approve(id: number, status: string = 'APPROVED') {
    await this.findOne(id);
    return this.prisma.question.update({
      where: { id },
      data: { status },
      include: { subject: true, options: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.question.delete({ where: { id } });
  }
}
