import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as mammoth from 'mammoth';
const pdfParse = require('pdf-parse');
import { PrismaService } from '../prisma/prisma.service';
import { GenerateAiQuestionsDto, QuestionOptionDto } from './dto/question.dto';
import { normalizeQuestionContent, validateQuestionOptions } from './question-validation';

@Injectable()
export class AiQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(input: GenerateAiQuestionsDto) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new ServiceUnavailableException('Chưa cấu hình GEMINI_API_KEY. AI không thể tạo câu hỏi.');
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: input.chapterId, subjectId: input.subjectId },
      include: { subject: true },
    });
    if (!chapter) throw new BadRequestException('Chương không thuộc môn học đã chọn.');

    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
    const timeout = Number(process.env.GEMINI_TIMEOUT_MS || 45000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const prompt = [
      `Tạo đúng ${input.count} câu hỏi khảo thí bằng tiếng Việt.`,
      `Môn: ${chapter.subject.subjectName}; chương: ${chapter.name}.`,
      `Loại: ${input.type}; độ khó: ${input.difficulty}; Bloom: ${input.bloomLevel}.`,
      input.prompt ? `Ngữ cảnh tài liệu: ${input.prompt}` : '',
      'Chỉ trả JSON: {"questions":[{"content":"","score":0.25,"explanation":"","keywords":"","options":[{"label":"A","content":"","isCorrect":true,"order":0}]}]}.',
      'SINGLE_CHOICE đúng 1 đáp án; MULTIPLE_CHOICE ít nhất 1; TRUE_FALSE đúng 2 lựa chọn; FILL_BLANK và ESSAY dùng options rỗng.',
    ].filter(Boolean).join('\n');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
        }),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new BadGatewayException(`Gemini trả lỗi HTTP ${response.status}: ${errText.slice(0, 100)}`);
      }
      const payload: any = await response.json();
      const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new BadGatewayException('Gemini không trả nội dung.');

      const jsonMatch = raw.match(/\{[\s\S]*\}/) || raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new BadGatewayException('Gemini không trả đúng định dạng JSON.');

      const parsed = JSON.parse(jsonMatch[0]);
      const rawQuestions = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.questions)
        ? parsed.questions
        : [];

      if (rawQuestions.length === 0) {
        throw new BadGatewayException('Gemini không tạo được câu hỏi nào.');
      }
      const questions = rawQuestions.map((item: any, index: number) => {
        if (typeof item.content !== 'string' || item.content.trim().length < 5) {
          throw new BadGatewayException(`Câu AI thứ ${index + 1} không hợp lệ.`);
        }
        const options: QuestionOptionDto[] = Array.isArray(item.options)
          ? item.options.map((option: any, order: number) => ({
              label: String(option.label || String.fromCharCode(65 + order)),
              content: String(option.content || ''),
              isCorrect: Boolean(option.isCorrect),
              order,
            }))
          : [];
        validateQuestionOptions(input.type, options);
        return {
          subjectId: input.subjectId,
          chapterId: input.chapterId,
          type: input.type,
          difficulty: input.difficulty,
          bloomLevel: input.bloomLevel,
          content: item.content.trim(),
          score: Number(item.score || 0.25),
          explanation: String(item.explanation || ''),
          keywords: String(item.keywords || ''),
          options,
        };
      });
      const normalized = questions.map((q) => normalizeQuestionContent(q.content));
      const existing = await this.prisma.question.findMany({
        where: { normalizedContent: { in: normalized }, deletedAt: null },
        select: { code: true, normalizedContent: true },
      });
      return questions.map((question) => ({
        ...question,
        duplicate: existing.find((row) => row.normalizedContent === normalizeQuestionContent(question.content)) || null,
      }));
    } catch (error: any) {
      if (error instanceof BadGatewayException) throw error;
      if (error?.name === 'AbortError') throw new BadGatewayException(`Gemini hết thời gian chờ sau ${timeout}ms.`);
      if (error instanceof SyntaxError) throw new BadGatewayException('Gemini trả JSON không hợp lệ.');
      throw new BadGatewayException(error?.message || 'Không thể kết nối Gemini.');
    } finally {
      clearTimeout(timer);
    }
  }

  async extractDocumentText(file: Express.Multer.File): Promise<{ text: string }> {
    if (!file) throw new BadRequestException('Vui lòng chọn tệp tài liệu.');
    const ext = file.originalname.toLowerCase();
    let text = '';
    if (ext.endsWith('.txt') || ext.endsWith('.md')) {
      text = file.buffer.toString('utf-8');
    } else if (ext.endsWith('.docx')) {
      const res = await mammoth.extractRawText({ buffer: file.buffer });
      text = res.value || '';
    } else if (ext.endsWith('.pdf')) {
      const res = await pdfParse(file.buffer);
      text = res.text || '';
    } else {
      throw new BadRequestException('Chỉ hỗ trợ tệp .txt, .md, .docx, .pdf');
    }
    return { text: text.trim().slice(0, 8000) };
  }
}
