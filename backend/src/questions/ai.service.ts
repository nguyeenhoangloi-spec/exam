import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as mammoth from 'mammoth';
const pdfParse = require('pdf-parse');
import { PrismaService } from '../prisma/prisma.service';
import { GenerateAiQuestionsDto, QuestionOptionDto } from './dto/question.dto';
import { normalizeQuestionContent, validateQuestionOptions } from './question-validation';

function parsePlainTextQuestions(rawText: string, defaultType = 'SINGLE_CHOICE'): any[] {
  return parseStructuredQuestionText(rawText, defaultType);
  /* legacy parser retained below for compatibility */
  const results: any[] = [];
  const cleanText = rawText.replace(/^```(?:json|text)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const questionBlocks = cleanText.split(/(?:^|\n)(?:Câu|Câu hỏi|\d+[\.\)])\s*/i).filter((b) => b.trim().length > 10);

  for (const block of questionBlocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const content = lines[0];
    const options: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optMatch = line.match(/^([A-D])[\.\)]\s*(.*)/i);
      if (optMatch) {
        options.push({
          label: optMatch[1].toUpperCase(),
          content: optMatch[2],
          isCorrect: line.includes('*') || line.toLowerCase().includes('đúng'),
          order: options.length,
        });
      }
    }

    if (options.length > 0 && !options.some((o) => o.isCorrect)) {
      options[0].isCorrect = true;
    }

    if (content.length > 3) {
      results.push({
        content,
        score: 0.25,
        explanation: '',
        keywords: '',
        options: defaultType === 'ESSAY' ? [] : options,
      });
    }
  }

  return results;
}

/** Parse common Word/PDF question layouts when Gemini returns plain text. */
function parseStructuredQuestionText(rawText: string, defaultType = 'SINGLE_CHOICE'): any[] {
  const results: any[] = [];
  const lines = rawText.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').split('\n').map((line) => line.trim()).filter(Boolean);
  const startsQuestion = (line: string) => /^(?:câu\s*(?:hỏi\s*)?\d+|cÃ¢u\s*(?:há»i\s*)?\d+|\d+)\s*[:.)-]\s*/iu.test(line);
  const blocks: string[][] = [];
  let block: string[] = [];
  for (const line of lines) {
    if (startsQuestion(line)) {
      if (block.length) blocks.push(block);
      block = [line];
    } else if (block.length) block.push(line);
  }
  if (block.length) blocks.push(block);
  for (const linesInQuestion of blocks) {
    const content = linesInQuestion[0]
      .replace(/^(?:câu\s*(?:hỏi\s*)?\d+|cÃ¢u\s*(?:há»i\s*)?\d+|\d+)\s*[:.)-]?\s*/iu, '')
      .trim();
    if (content.length < 3) continue;
    const options: any[] = [];
    let answerLabel = '';
    let explanation = '';
    for (const line of linesInQuestion.slice(1)) {
      const answer = line.match(/^(?:đáp\s*án(?:\s*đúng)?|dap\s*an|cÃ¡p\sÃ¡n|answer)\s*[:.)-]?\s*([A-D])/iu);
      if (answer) { answerLabel = answer[1].toUpperCase(); continue; }
      const explanationMatch = line.match(/^(?:giải thích|giáº£i thÃ­ch|explanation)\s*[:.)-]?\s*(.*)$/iu);
      if (explanationMatch) { explanation = explanationMatch[1].trim(); continue; }
      const option = line.match(/^([A-D])\s*[.)-]\s*(.*)$/i);
      if (option) {
        options.push({ label: option[1].toUpperCase(), content: option[2].replace(/[★✓✔]\s*$/u, '').trim(), isCorrect: false, order: options.length });
      } else if (options.length) {
        options[options.length - 1].content += ` ${line}`;
      }
    }
    if (answerLabel) options.forEach((option) => { option.isCorrect = option.label === answerLabel; });
    results.push({ content, score: 0.25, explanation, keywords: '', options: defaultType === 'ESSAY' ? [] : options });
  }
  return results;
}

function extractValidQuestionsFromTruncatedJson(raw: string): any[] {
  const list: any[] = [];
  let depth = 0;
  let startIdx = -1;
  let inStr = false;
  let esc = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (char === '\\') {
      esc = true;
      continue;
    }
    if (char === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;

    if (char === '{') {
      if (depth === 0) {
        startIdx = i;
      }
      depth++;
    } else if (char === '}') {
      if (depth > 0) {
        depth--;
        if (startIdx !== -1 && (depth === 0 || depth === 1)) {
          const sub = raw.slice(startIdx, i + 1);
          try {
            const parsedObj = JSON.parse(sub);
            if (parsedObj && typeof parsedObj === 'object' && parsedObj.content && typeof parsedObj.content === 'string') {
              list.push(parsedObj);
              startIdx = -1;
            }
          } catch {
            // Ignore incomplete object
          }
        }
      }
    }
  }

  if (list.length === 0) {
    const objectRegex = /\{\s*"content"\s*:\s*"[\s\S]*?"\s*,\s*"score"[\s\S]*?\}/g;
    let match;
    while ((match = objectRegex.exec(raw)) !== null) {
      try {
        const obj = JSON.parse(match[0]);
        if (obj && obj.content) list.push(obj);
      } catch {}
    }
  }

  return list;
}

function repairAndParseJson(raw: string): any {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    let repaired = cleaned.replace(/,\s*([}\]])/g, '$1');
    let openBraces = 0, openSquare = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces = Math.max(0, openBraces - 1);
        else if (char === '[') openSquare++;
        else if (char === ']') openSquare = Math.max(0, openSquare - 1);
      }
    }

    if (inString) repaired += '"';
    repaired = repaired.replace(/,\s*$/, '');

    while (openBraces > 0) {
      repaired += '}';
      openBraces--;
    }
    while (openSquare > 0) {
      repaired += ']';
      openSquare--;
    }

    try {
      return JSON.parse(repaired);
    } catch (e2) {
      const lastObjIdx = repaired.lastIndexOf('}');
      if (lastObjIdx > 0) {
        const truncatedSlice = repaired.slice(0, lastObjIdx + 1);
        const lastSquare = truncatedSlice.lastIndexOf('[');
        if (lastSquare > -1) {
          const sliceFix = truncatedSlice + ']}';
          try {
            return JSON.parse(sliceFix);
          } catch {
            const sliceFix2 = truncatedSlice + ']';
            try { return JSON.parse(sliceFix2); } catch {}
          }
        }
      }

      const salvaged = extractValidQuestionsFromTruncatedJson(raw);
      if (salvaged.length > 0) {
        return { questions: salvaged };
      }

      throw e1;
    }
  }
}


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
          `Nhiệm vụ: Trích xuất TOÀN BỘ các câu hỏi từ tài liệu văn bản dưới đây.`,
          `Môn học: ${subject.subjectName}; ${chapter ? `Chương: ${chapter.name}.` : 'Không phân chương.'}`,
          `Loại mặc định: ${input.type}; Độ khó: ${input.difficulty}; Bloom: ${input.bloomLevel}.`,
          `YÊU CẦU BẮT BUỘC:`,
          `1. Đọc và trích xuất TOÀN BỘ các câu hỏi có trong tài liệu (tối đa ${input.count || 100} câu hỏi, không tự ý bỏ bớt).`,
          input.type === 'ESSAY'
            ? `2. Đây là dạng TỰ LUẬN. Đặt options: [] (không tạo lựa chọn A, B, C, D). Đưa gợi ý chấm/Rubric vào phần explanation.`
            : `2. Trích xuất nội dung từng câu hỏi và danh sách đáp án A, B, C, D... Đánh dấu isCorrect: true cho đáp án đúng.`,
          `3. Không tự tạo thêm câu hỏi ngoài tài liệu.`,
          `4. Nếu câu hỏi gắn với hình, thêm imageIndexes là mảng chỉ số ảnh (bắt đầu từ 0); nếu không thì [].`,
          `5. CHỈ TRẢ VỀ DẠNG JSON duy nhất: {"questions":[{"content":"","score":0.25,"explanation":"","keywords":"","imageIndexes":[],"options":[]}]}.`,
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
    let raw = '';
    try {
      const candidateModels = Array.from(new Set([model, 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-2.5-flash']));
      let response: Response | null = null;
      let lastErrText = '';

      for (const candidateModel of candidateModels) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidateModel)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 8192 },
          }),
        });

        if (res.ok) {
          response = res;
          break;
        }

        const errText = await res.text().catch(() => '');
        lastErrText = errText;
        if (res.status === 429 || res.status === 403) {
          // Exceeded Quota or Forbidden - break early to try DeepSeek
          break;
        }
      }

      if (response && response.ok) {
        const payload: any = await response.json();
        raw = payload.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        throw new Error(lastErrText || 'Gemini unavailable');
      }
    } catch (geminiError: any) {
      // Fallback sang DeepSeek Provider nếu Gemini bị hết Quota (HTTP 429) hoặc lỗi server
      try {
        const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
        if (!deepseekKey) throw geminiError;
        const baseUrl = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
        const dsModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
        const endpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;

        const dsRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${deepseekKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: dsModel,
            messages: [
              { role: 'system', content: 'Bạn là chuyên gia khảo thí. Hãy chỉ xuất kết quả duy nhất ở dạng chuỗi JSON chuẩn.' },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 8192,
          }),
        });

        if (!dsRes.ok) {
          const dsErr = await dsRes.text().catch(() => '');
          throw new BadGatewayException(`DeepSeek AI trả lỗi HTTP ${dsRes.status}: ${dsErr.slice(0, 100)}`);
        }

        const dsData: any = await dsRes.json();
        raw = dsData?.choices?.[0]?.message?.content || '';
      } catch (dsErr: any) {
        const gMsg = geminiError?.message || 'Gemini error';
        const dMsg = dsErr?.message || 'DeepSeek error';
        throw new BadGatewayException(`Hệ thống AI tạm thời bận (Gemini: ${gMsg.slice(0, 80)}, DeepSeek: ${dMsg.slice(0, 80)})`);
      }
    }
      if (!raw || raw.trim().length === 0) {
        throw new BadGatewayException('AI không trả nội dung.');
      }

      let rawQuestions: any[] = [];
      try {
        const parsed = repairAndParseJson(raw);
        rawQuestions = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.questions)
          ? parsed.questions
          : [];
      } catch {
        // Fallthrough to fallback parsers
      }

      if (!rawQuestions || rawQuestions.length === 0) {
        rawQuestions = extractValidQuestionsFromTruncatedJson(raw);
      }

      if (!rawQuestions || rawQuestions.length === 0) {
        rawQuestions = parsePlainTextQuestions(raw, input.type);
      }

      if (!rawQuestions || rawQuestions.length === 0) {
        throw new BadGatewayException('Không thể bóc tách câu hỏi từ tài liệu. Vui lòng kiểm tra lại nội dung file Word/PDF.');
      }
      const questions: any[] = [];
      for (const item of rawQuestions) {
        if (!item || typeof item.content !== 'string' || item.content.trim().length < 3) {
          continue;
        }
        const isEssay = input.type === 'ESSAY';
        const options: QuestionOptionDto[] = (Array.isArray(item.options) && !isEssay)
          ? item.options.map((option: any, order: number) => ({
              label: String(option.label || String.fromCharCode(65 + order)),
              content: String(option.content || ''),
              isCorrect: Boolean(option.isCorrect),
              order,
            }))
          : [];
        try {
          validateQuestionOptions(input.type, options);
        } catch {
          // If option validation fails for single choice, attempt to fix or set first option as correct
          if (options.length > 0 && !options.some(o => o.isCorrect)) {
            options[0].isCorrect = true;
          }
        }
        const imageIndexes = Array.isArray(item.imageIndexes) ? item.imageIndexes.filter((index: any) => Number.isInteger(index) && index >= 0 && index < (input.images || []).length) : [];
        questions.push({
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
          sourceImages: imageIndexes.map((index: number) => ({ ...(input.images || [])[index], index })),
        });
      }

      if (questions.length === 0) {
        throw new BadGatewayException('Không có câu hỏi nào hợp lệ được trích xuất.');
      }

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
          if (images.length < 50 && Buffer.byteLength(data, 'base64') <= 8 * 1024 * 1024) images.push({ mimeType, data });
          return { src: `data:${mimeType};base64,${data}` };
        })),
      });
      text = String(res.value || '').replace(/<img[^>]*>/gi, ' [HÌNH ẢNH] ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      // Mammoth trả HTML; chuẩn hóa lại thành văn bản có xuống dòng để bảo toàn
      // ranh giới câu hỏi/đáp án trong tài liệu Word.
      text = text
        .replace(/\n?\s*\[HÃŒNH áº¢NH\]\s*/gi, '\n[HÌNH ẢNH]\n')
        .replace(/\s{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      // Rebuild from the original HTML after the legacy normalization above;
      // this second pass intentionally preserves paragraph and table boundaries.
      text = String(res.value || '')
        .replace(/<img[^>]*>/gi, '\n[HÌNH ẢNH]\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, '\n')
        .replace(/<t[dh][^>]*>/gi, '\t')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } else if (ext.endsWith('.pdf')) {
      const parser = new pdfParse.PDFParse({ data: file.buffer });
      try {
        const res = await parser.getText();
        text = res.text || '';
        try {
          const extracted = await parser.getImage({ imageBuffer: true, imageDataUrl: true, imageThreshold: 1 });
          let imageBytes = 0;
          for (const page of extracted.pages || []) for (const image of page.images || []) {
            const match = String(image.dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
            if (match && images.length < 50 && imageBytes + Buffer.byteLength(match[2], 'base64') <= 8 * 1024 * 1024) {
              images.push({ mimeType: match[1], data: match[2], altText: `Ảnh trang ${page.pageNumber}` });
              imageBytes += Buffer.byteLength(match[2], 'base64');
            }
          }
        } catch { /* PDF gốc vẫn được gửi cho Gemini nếu thư viện không giải mã được ảnh */ }
      } finally { await parser.destroy(); }
      // Gemini nhận PDF gốc ở dạng inlineData để đọc cả ảnh, biểu đồ và PDF scan.
      documentData = { mimeType: 'application/pdf', data: file.buffer.toString('base64') };
    } else {
      throw new BadRequestException('Chỉ hỗ trợ tệp .txt, .md, .docx, .pdf');
    }
    return { text: text.trim().slice(0, 100000), images, ...(documentData ? { documentData } : {}) };
  }
}
