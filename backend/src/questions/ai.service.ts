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
    const subject = await this.prisma.subject.findUnique({ where: { id: input.subjectId } });
    if (!subject) throw new BadRequestException('Môn học không tồn tại.');
    const chapter = input.chapterId
      ? await this.prisma.chapter.findFirst({ where: { id: input.chapterId, subjectId: input.subjectId } })
      : null;
    if (input.chapterId && !chapter) throw new BadRequestException('Chương không thuộc môn học đã chọn.');

    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
    const configuredTimeout = Number(process.env.GEMINI_TIMEOUT_MS || 180000);
    const timeout = Number.isFinite(configuredTimeout) && configuredTimeout >= 30000 ? Math.min(configuredTimeout, 300000) : 180000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const isExtraction = Boolean(input.isExtractionOnly || (input.prompt && input.prompt.length > 20));
    const prompt = isExtraction
      ? [
          `Nhiệm vụ: Trích xuất TOÀN BỘ tất cả các câu hỏi và các lựa chọn đáp án từ tài liệu văn bản dưới đây.`,
          `Môn học: ${subject.subjectName}; ${chapter ? `Chương: ${chapter.name}.` : 'Không phân chương.'}`,
          `Loại mặc định: ${input.type}; Độ khó: ${input.difficulty}; Bloom: ${input.bloomLevel}.`,
          `YÊU CẦU BẮT BUỘC:`,
          `1. Đọc và trích xuất TOÀN BỘ các câu hỏi có trong tài liệu (trích xuất tối đa lên tới ${input.count || 100} câu hỏi, tuyệt đối không tự ý bỏ bớt câu nào).`,
          `2. Trích xuất đúng nội dung từng câu hỏi và danh sách các lựa chọn A, B, C, D...`,
          `3. Xác định hoặc suy luận đáp án đúng cho từng câu hỏi và đánh dấu isCorrect: true cho lựa chọn đó.`,
          `4. Không tự tạo thêm câu hỏi mới ngoài nội dung tài liệu.`,
          `5. CHỈ TRẢ VỀ DẠNG JSON duy nhất: {"questions":[{"content":"","score":0.25,"explanation":"","keywords":"","options":[{"label":"A","content":"","isCorrect":true,"order":0}]}]}.`,
          `NỘI DUNG TÀI LIỆU CẦN TRÍCH XUẤT:\n${input.prompt}`,
        ].join('\n')
      : [
          `Tạo đúng ${input.count} câu hỏi khảo thí bằng tiếng Việt.`,
          `Môn: ${subject.subjectName}; ${chapter ? `chương: ${chapter.name}.` : 'không phân chương.'}`,
          `Loại: ${input.type}; độ khó: ${input.difficulty}; Bloom: ${input.bloomLevel}.`,
          'Chỉ trả JSON: {"questions":[{"content":"","score":0.25,"explanation":"","keywords":"","options":[{"label":"A","content":"","isCorrect":true,"order":0}]}]}.',
          'SINGLE_CHOICE đúng 1 đáp án; MULTIPLE_CHOICE ít nhất 1; TRUE_FALSE đúng 2 lựa chọn; FILL_BLANK và ESSAY dùng options rỗng.',
        ].filter(Boolean).join('\n');
    try {
      const parts: Array<Record<string, unknown>> = [{ text: prompt }];
      for (const image of input.images || []) {
        if (!/^image\/(png|jpeg|jpg|webp|svg\+xml)$/.test(image.mimeType) || !image.data) continue;
        parts.push({ inlineData: { mimeType: image.mimeType === 'image/jpg' ? 'image/jpeg' : image.mimeType, data: image.data } });
      }
      if (input.documentData?.mimeType === 'application/pdf' && input.documentData.data) {
        parts.push({ inlineData: { mimeType: 'application/pdf', data: input.documentData.data } });
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts }],
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

  async extractDocumentText(file: Express.Multer.File): Promise<{ text: string; images: Array<{ mimeType: string; data: string; altText?: string }>; documentData?: { mimeType: string; data: string } }> {
    if (!file) throw new BadRequestException('Vui lòng chọn tệp tài liệu.');
    const ext = file.originalname.toLowerCase();
    let text = '';
    const images: Array<{ mimeType: string; data: string; altText?: string }> = [];
    let documentData: { mimeType: string; data: string } | undefined;
    if (ext.endsWith('.txt') || ext.endsWith('.md')) {
      text = file.buffer.toString('utf-8');
    } else if (ext.endsWith('.docx')) {
      const res = await (mammoth as any).convertToHtml({ buffer: file.buffer }, {
        convertImage: (mammoth as any).images.imgElement((image: any) => image.read('base64').then((data: string) => {
          const mimeType = image.contentType || 'image/png';
          images.push({ mimeType, data });
          return { src: `data:${mimeType};base64,${data}` };
        })),
      });
      text = String(res.value || '').replace(/<img[^>]*>/gi, ' [HÌNH ẢNH] ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    } else if (ext.endsWith('.pdf')) {
      const res = await pdfParse(file.buffer);
      text = res.text || '';
      // Gemini nhận PDF gốc ở dạng inlineData để đọc cả ảnh, biểu đồ và PDF scan.
      documentData = { mimeType: 'application/pdf', data: file.buffer.toString('base64') };
    } else {
      throw new BadRequestException('Chỉ hỗ trợ tệp .txt, .md, .docx, .pdf');
    }
    return { text: text.trim().slice(0, 100000), images, ...(documentData ? { documentData } : {}) };
  }
}
