import { BadGatewayException, BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
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

/** Parse common Word/PDF question layouts when AI returns plain text or API is unreachable. */
function parseStructuredQuestionText(rawText: string, defaultType = 'SINGLE_CHOICE'): any[] {
  if (!rawText || !rawText.trim()) return [];
  const text = rawText.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');

  // Tách riêng phần BẢNG ĐÁP ÁN ở cuối tài liệu nếu có (tránh coi 100 đáp án thành 100 câu hỏi rỗng)
  const answerSectionRegex = /(?:^|\n)\s*(?:ĐÁP\s*ÁN|DAP\s*AN|ANSWER\s*KEY|ANSWERS?|BẢNG\s*ĐÁP\s*ÁN|HUỚNG\s*DẪN\s*ĐÁP\s*ÁN|LỜI\s*GIẢI|KẾT\s*QUẢ|GỢI\s*Ý|KEY)\s*[:.-]?\s*(?:\n|$)/i;
  const matchAnswerSec = text.match(answerSectionRegex);
  let questionsText = text;
  let answersText = '';

  if (matchAnswerSec && matchAnswerSec.index !== undefined) {
    questionsText = text.slice(0, matchAnswerSec.index);
    answersText = text.slice(matchAnswerSec.index + matchAnswerSec[0].length);
  }

  const lines = questionsText.split('\n').map((line) => line.trim()).filter(Boolean);

  // Map đáp án cuối bài: e.g. "1. school", "2. cat" hoặc "1. A", "2. B"
  const answerMap = new Map<number, string>();
  if (answersText) {
    const ansLines = answersText.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of ansLines) {
      const m = line.match(/^(?:câu\s*)?(\d+)[\s.:-]+\s*(.+)$/i);
      if (m) {
        answerMap.set(parseInt(m[1], 10), m[2].trim());
      }
    }
  }

  const startsQuestion = (line: string) =>
    /^(?:câu\s*(?:hỏi\s*)?\d+|cÃ¢u\s*(?:há» i\s*)?\d+|bài\s*\d+|question\s*\d+|q\d+|\d+)\s*[:.)-]\s*/iu.test(line);

  const blocks: string[][] = [];
  let block: string[] = [];

  for (const line of lines) {
    if (startsQuestion(line)) {
      if (block.length > 0) blocks.push(block);
      block = [line];
    } else if (block.length > 0) {
      block.push(line);
    }
  }
  if (block.length > 0) blocks.push(block);

  const results: any[] = [];
  let qIndex = 0;

  for (const linesInQuestion of blocks) {
    if (linesInQuestion.length === 0) continue;
    qIndex++;

    let content = linesInQuestion[0]
      .replace(/^(?:câu\s*(?:hỏi\s*)?\d+|cÃ¢u\s*(?:há» i\s*)?\d+|bài\s*\d+|question\s*\d+|q\d+|\d+)\s*[:.)-]?\s*/iu, '')
      .trim();
    if (content.length < 2) continue;

    const options: any[] = [];
    let answerLabel = '';
    let explanation = '';
    const keyAnswer = answerMap.get(qIndex) || '';

    for (let i = 1; i < linesInQuestion.length; i++) {
      const line = linesInQuestion[i];
      const answer = line.match(/^(?:đáp\s*án(?:\s*đúng)?|dap\s*an|answer|lời\s*giải\s*đúng)\s*[:.)-]?\s*([A-Z])/iu);
      if (answer) {
        answerLabel = answer[1].toUpperCase();
        continue;
      }
      const explanationMatch = line.match(/^(?:giải\s*thích|hướng\s*dẫn(?:\s*đáp\s*án)?|gợi\s*ý\s*chấm|explanation|lời\s*giải)\s*[:.)-]?\s*(.*)$/iu);
      if (explanationMatch) {
        explanation = explanationMatch[1].trim();
        continue;
      }
      const option = line.match(/^([A-Z])\s*[.)-]\s*(.*)$/i);
      if (option) {
        let optText = option[2].replace(/[★✓✔*]\s*$/u, '').trim();
        let isCorrect = line.includes('*') || line.includes('★') || line.includes('✓') || line.includes('✔');
        options.push({
          label: option[1].toUpperCase(),
          content: optText,
          isCorrect,
          order: options.length,
        });
      } else if (options.length > 0) {
        options[options.length - 1].content += `\n${line}`;
      } else {
        content += `\n${line}`;
      }
    }

    if (!answerLabel && keyAnswer && /^[A-Z]$/i.test(keyAnswer)) {
      answerLabel = keyAnswer.toUpperCase();
    }

    if (answerLabel && options.length > 0) {
      options.forEach((opt) => {
        opt.isCorrect = opt.label === answerLabel;
      });
    }

    if (options.length > 0 && !options.some((o) => o.isCorrect)) {
      options[0].isCorrect = true;
    }

    const fillBlankAnswers: any[] = [];
    if (defaultType === 'FILL_BLANK') {
      if (!content.includes('{{blank_')) {
        let bCount = 0;
        content = content.replace(/(?:\.\.\.|_{2,}|\[\s*\]|\(\s*\))/g, () => {
          bCount++;
          return `{{blank_${bCount}}}`;
        });
        if (bCount === 0) {
          content += ' {{blank_1}}';
        }
      }
      content = content.replace(/(\{\{blank_\d+)(?!\}\})/gi, '$1}}');
      const matches = content.match(/\{\{blank_\d+\}\}/g) || [];
      matches.forEach((_, idx) => {
        fillBlankAnswers.push({
          blankIndex: idx + 1,
          answer: keyAnswer || explanation || '',
          acceptedAnswers: [],
          score: 0.25 / matches.length,
          caseSensitive: false,
          ignoreWhitespace: true,
          ignoreVietnameseTone: false,
        });
      });
    }

    results.push({
      content,
      score: 0.25,
      explanation,
      keywords: '',
      options: defaultType === 'ESSAY' || defaultType === 'FILL_BLANK' ? [] : options,
      fillBlankAnswers,
    });
  }

  return results;
}

function extractValidQuestionsFromTruncatedJson(raw: string): any[] {
  const list: any[] = [];
  if (!raw) return list;

  // 1. Try direct JSON parse
  try {
    let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    if (/^["']?questions["']?\s*:/i.test(cleaned) && !cleaned.startsWith('{')) {
      cleaned = '{' + cleaned + '}';
    }
    const parsed = JSON.parse(cleaned);
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.questions) ? parsed.questions : null;
    if (arr && arr.length > 0) {
      return arr.filter((x: any) => x && typeof x === 'object' && x.content && typeof x.content === 'string');
    }
  } catch { }

  // 2. Bracket balance scanner
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
      if (depth === 0) startIdx = i;
      depth++;
    } else if (char === '}') {
      if (depth > 0) {
        depth--;
        if (depth === 0 && startIdx !== -1) {
          const sub = raw.slice(startIdx, i + 1);
          try {
            const parsedObj = JSON.parse(sub);
            if (parsedObj && typeof parsedObj === 'object') {
              if (Array.isArray(parsedObj.questions)) {
                list.push(...parsedObj.questions.filter((q: any) => q && typeof q === 'object' && q.content));
              } else if (parsedObj.content && typeof parsedObj.content === 'string' && !parsedObj.content.includes('"content"')) {
                list.push(parsedObj);
              }
            }
          } catch { }
          startIdx = -1;
        }
      }
    }
  }

  return list;
}

function repairAndParseJson(raw: string): any {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  if (/^["']?questions["']?\s*:/i.test(cleaned) && !cleaned.startsWith('{')) {
    cleaned = '{' + cleaned + '}';
  }

  // Try direct parse first!
  try {
    return JSON.parse(cleaned);
  } catch { }

  const qMatch = cleaned.match(/["']?questions["']?\s*:\s*(\[[\s\S]*)/i);
  if (qMatch) {
    try {
      const fixed = '{"questions":' + qMatch[1] + (qMatch[1].endsWith('}') ? '' : '}');
      return JSON.parse(fixed);
    } catch { }
  }

  // Find outermost valid JSON structure ([...] or {...})
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let targetJson = cleaned;
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket > firstBracket) {
      targetJson = cleaned.slice(firstBracket, lastBracket + 1);
    }
  } else if (firstBrace !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > firstBrace) {
      targetJson = cleaned.slice(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(targetJson);
  } catch (e1) {
    let repaired = targetJson.replace(/,\s*([}\]])/g, '$1');
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
            try { return JSON.parse(sliceFix2); } catch { }
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
  private readonly logger = new Logger(AiQuestionsService.name);
  constructor(private readonly prisma: PrismaService) { }

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
    const isExtraction = Boolean(input.isExtractionOnly);
    const prompt = isExtraction
      ? [
        `Nhiệm vụ: Trích xuất chính xác và đầy đủ TOÀN BỘ các câu hỏi và đáp án từ tài liệu văn bản dưới đây.`,
        `Môn học: ${subject.subjectName}; ${chapter ? `Chương: ${chapter.name}.` : 'Không phân chương.'}`,
        `Loại mặc định: ${input.type}; Độ khó: ${input.difficulty}; Bloom: ${input.bloomLevel}.`,
        `YÊU CẦU BẮT BUỘC QUAN TRỌNG:`,
        `1. ĐỐI CHIẾU ĐÁP ÁN CUỐI TÀI LIỆU: Rất nhiều tài liệu có danh sách câu hỏi ở phần trên và PHẦN ĐÁP ÁN / BẢNG ĐÁP ÁN / ANSWER KEY nằm ở cuối bài (ví dụ: 1. A, 2. B... hoặc 1. school, 2. cat...). BẠN PHẢI TỰ ĐỘNG GHÉP TỪNG ĐÁP ÁN Ở PHẦN CUỐI BÀI VÀO CÂU HỎI TƯƠNG ỨNG Ở PHẦN TRÊN.`,
        `2. KHÔNG TẠO CÂU HỎI DƯ THỪA: Tuyệt đối KHÔNG ĐƯỢC bóc tách phần danh sách đáp án ở cuối bài thành các câu hỏi mới độc lập. Số lượng câu hỏi trích xuất ra phải ĐÚNG BẰNG số câu hỏi thực tế trong đề bài (Ví dụ: Tài liệu có 100 câu hỏi và 100 đáp án ở cuối -> Trích xuất đúng 100 câu hỏi đầy đủ đáp án, KHÔNG TRÍCH XUẤT THÀNH 200 CÂU).`,
        input.type === 'FILL_BLANK'
          ? `3. Dạng ĐIỀN VÀO CHỖ TRỐNG (FILL_BLANK):
             - Vị trí chỗ trống trong "content" BẮT BUỘC dùng định dạng {{blank_1}}, {{blank_2}}... (Ví dụ: "Từ tiếng Anh của 'Trường học' là: {{blank_1}}"). BẮT BUỘC đóng đủ hai dấu ngoặc nhọn }}.
             - Đặt options: [].
             - BẮT BUỘC trả về danh sách đáp án tương ứng trong "fillBlankAnswers": [{"blankIndex": 1, "answer": "đáp_án_chính_xác", "acceptedAnswers": [], "score": 0.25}].
             - NẾU TRONG TÀI LIỆU KHÔNG CÓ SẴN ĐÁP ÁN HOẶC BỊ THIẾU: Bạn BẮT BUỘC phải dựa vào kiến thức môn học ${subject.subjectName} để TỰ ĐỘNG ĐIỀN ĐÁP ÁN ĐÚNG NGHĨA VÀ CHÍNH XÁC NHẤT vào trường "answer" của "fillBlankAnswers" (Tuyệt đối KHÔNG ĐƯỢC để trường "answer" bị rỗng hoặc để trống).`
          : input.type === 'ESSAY'
            ? `3. Dạng TỰ LUẬN. Đặt options: []. Trích xuất hoặc tự biên soạn hướng dẫn đáp án mẫu chuẩn xác vào "explanation".`
            : `3. Dạng TRẮC NGHIỆM: Trích xuất danh sách các lựa chọn A, B, C, D... Đánh dấu isCorrect: true cho đáp án đúng (dựa vào phần đáp án ở cuối tài liệu hoặc tự giải).`,
        `4. Nếu câu hỏi gắn với hình, thêm imageIndexes là mảng chỉ số ảnh (bắt đầu từ 0); nếu không thì [].`,
        `5. CHỈ TRẢ VỀ DẠNG JSON duy nhất: {"questions":[{"content":"","score":0.25,"explanation":"","keywords":"","imageIndexes":[],"options":[],"fillBlankAnswers":[{"blankIndex":1,"answer":"đáp án","acceptedAnswers":[]}]}]}.`,
        `NỘI DUNG TÀI LIỆU CẦN TRÍCH XUẤT:\n${input.prompt}`,
      ].join('\n')
      : [
        `Tạo ĐÚNG CHÍNH XÁC ${input.count} câu hỏi khảo thí bằng tiếng Việt.`,
        `Môn: ${subject.subjectName}; ${chapter ? `Chương: ${chapter.name}.` : 'Không phân chương.'}`,
        `Loại: ${input.type}; Độ khó: ${input.difficulty}; Bloom: ${input.bloomLevel}.`,
        input.prompt ? `YÊU CẦU: Sinh các câu hỏi bám sát 100% nội dung Đề cương/Bài giảng tham khảo dưới đây. Tạo đúng chính xác ${input.count} câu hỏi, tuyệt đối không tạo thiếu hay tạo thừa:\n\n${input.prompt}` : '',
        'Chỉ trả JSON: {"questions":[{"content":"","score":0.25,"explanation":"","keywords":"","options":[{"label":"A","content":"","isCorrect":true,"order":0}],"fillBlankAnswers":[{"blankIndex":1,"answer":"","acceptedAnswers":[]}]}]}.',
        'SINGLE_CHOICE đúng 1 đáp án; MULTIPLE_CHOICE ít nhất 1; TRUE_FALSE đúng 2 lựa chọn; FILL_BLANK và ESSAY dùng options rỗng.',
        input.type === 'FILL_BLANK' ? 'For FILL_BLANK, content must contain {{blank_1}}, {{blank_2}} and output fillBlankAnswers:[{blankIndex:1,answer:"answer",acceptedAnswers:[],score:0.25}]. options must be [] and blank scores must equal question score.' : '',
      ].filter(Boolean).join('\n');
    let rawQuestions: any[] = [];
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
              generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 16384 },
            }),
          });

          if (res.ok) {
            response = res;
            break;
          }

          const errText = await res.text().catch(() => '');
          lastErrText = errText;
          if (res.status >= 400) {
            // API Key error, Quota exceeded, or Forbidden - break early to try DeepSeek / fallback
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
            this.logger.warn(`DeepSeek AI trả lỗi HTTP ${dsRes.status}: ${dsErr.slice(0, 200)}`);
            throw new BadGatewayException('Dịch vụ AI đang tạm thời gặp sự cố. Vui lòng thử lại sau.');
          }

          const dsData: any = await dsRes.json();
          raw = dsData?.choices?.[0]?.message?.content || '';
        } catch (dsErr: any) {
          // Nếu gọi API AI thất bại (do Hết Quota/Key bận), chuyển sang chế độ Tự động bóc tách cục bộ từ văn bản tài liệu
          this.logger.warn(`AI providers đều thất bại. Gemini: ${geminiError?.message}, DeepSeek: ${dsErr?.message}`);
          rawQuestions = parsePlainTextQuestions(input.prompt || '', input.type);
          if (!rawQuestions || rawQuestions.length === 0) {
            throw new BadGatewayException('Hệ thống AI đang tạm thời bận. Vui lòng thử lại sau.');
          }
        }
      }

      const localParsed = parsePlainTextQuestions(input.prompt || '', input.type);

      if (!rawQuestions || rawQuestions.length === 0) {
        if (!raw || raw.trim().length === 0) {
          rawQuestions = localParsed;
        } else {
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
            rawQuestions = localParsed;
          }
        }
      }

      // Chỉ dùng localParsed khi AI không bóc tách được câu hỏi nào
      if ((!rawQuestions || rawQuestions.length === 0) && localParsed && localParsed.length > 0) {
        rawQuestions = localParsed;
      }

function pairQuestionsAndAnswers(rawItems: any[], defaultType: string): any[] {
  if (!rawItems || rawItems.length < 4) return rawItems;
  // BẮT BUỘC: Chỉ gộp đáp án cho dạng ĐIỀN VÀO CHỖ TRỐNG (FILL_BLANK)
  // Tuyệt đối không áp dụng cho TRẮC NGHIỆM (SINGLE_CHOICE/MULTIPLE_CHOICE) hay TỰ LUẬN
  if (defaultType !== 'FILL_BLANK') return rawItems;

  const total = rawItems.length;

  // Pattern A: Half questions (with blank/prompt), Half short answers (e.g. 100 questions + 100 answers)
  if (total % 2 === 0) {
    const half = total / 2;
    const firstHalf = rawItems.slice(0, half);
    const secondHalf = rawItems.slice(half);

    const firstHalfHasBlanks = firstHalf.every((q) => {
      const c = String(q.content || '');
      return c.includes('{{blank_') || c.includes('...') || c.includes('___') || c.length > 12;
    });

    const secondHalfLooksLikeAnswers = secondHalf.every((q) => {
      const c = String(q.content || '').trim();
      const hasOptions = Array.isArray(q.options) && q.options.length > 0;
      return !hasOptions && !c.includes('...') && !c.includes('___') && c.length < 60;
    });

    if (firstHalfHasBlanks && secondHalfLooksLikeAnswers) {
      return firstHalf.map((q, idx) => {
        const ansObj = secondHalf[idx];
        let answerText = String(ansObj?.content || '').trim();
        answerText = answerText
          .replace(/\{\{blank_\d+\}\}/gi, '')
          .replace(/^(?:\d+[\s.:-]*|đáp\s*án\s*[:.-]?|answer\s*[:.-]?|key\s*[:.-]?)\s*/iu, '')
          .replace(/\{\{blank_\d+\}\}/gi, '')
          .replace(/^["'«“]+|["'»”]+$/g, '')
          .trim();

        let content = String(q.content || '');
        if (!content.includes('{{blank_')) {
          let bCount = 0;
          content = content.replace(/(?:\.\.\.|_{2,}|\[\s*\]|\(\s*\))/g, () => {
            bCount++;
            return `{{blank_${bCount}}}`;
          });
          if (bCount === 0) content += ' {{blank_1}}';
        }
        content = content.replace(/(\{\{blank_\d+)(?!\}\})/gi, '$1}}');

        const matches = content.match(/\{\{blank_\d+\}\}/g) || ['{{blank_1}}'];
        const fillBlankAnswers = matches.map((_, mIdx) => ({
          blankIndex: mIdx + 1,
          answer: answerText || String(q.explanation || '').replace(/\{\{blank_\d+\}\}/gi, '').split('.')[0]?.trim() || '',
          acceptedAnswers: [],
          score: 0.25 / matches.length,
          caseSensitive: false,
          ignoreWhitespace: true,
          ignoreVietnameseTone: false,
        }));

        let cleanExp = String(q.explanation || '').replace(/\{\{blank_\d+\}\}/gi, '').trim();
        if (!cleanExp || cleanExp.includes('{{blank_')) {
          cleanExp = `Đáp án: ${answerText}`;
        }

        return {
          ...q,
          content,
          fillBlankAnswers,
          explanation: cleanExp,
        };
      });
    }

    // Pattern B: Interleaved (Odd = question, Even = answer)
    let isInterleaved = true;
    for (let i = 0; i < total; i += 2) {
      const q = rawItems[i];
      const a = rawItems[i + 1];
      const qContent = String(q?.content || '');
      const aContent = String(a?.content || '').trim();
      const aHasOptions = Array.isArray(a?.options) && a.options.length > 0;
      const qHasBlank = qContent.includes('{{blank_') || qContent.includes('...') || qContent.includes('___') || qContent.length > 12;
      const aIsShort = !aHasOptions && !aContent.includes('...') && aContent.length < 60;

      if (!qHasBlank || !aIsShort) {
        isInterleaved = false;
        break;
      }
    }

    if (isInterleaved) {
      const paired: any[] = [];
      for (let i = 0; i < total; i += 2) {
        const q = rawItems[i];
        const a = rawItems[i + 1];
        let answerText = String(a?.content || '').trim()
          .replace(/\{\{blank_\d+\}\}/gi, '')
          .replace(/^(?:\d+[\s.:-]*|đáp\s*án\s*[:.-]?|answer\s*[:.-]?|key\s*[:.-]?)\s*/iu, '')
          .replace(/\{\{blank_\d+\}\}/gi, '')
          .replace(/^["'«“]+|["'»”]+$/g, '')
          .trim();

        let content = String(q.content || '');
        if (!content.includes('{{blank_')) {
          let bCount = 0;
          content = content.replace(/(?:\.\.\.|_{2,}|\[\s*\]|\(\s*\))/g, () => {
            bCount++;
            return `{{blank_${bCount}}}`;
          });
          if (bCount === 0) content += ' {{blank_1}}';
        }
        content = content.replace(/(\{\{blank_\d+)(?!\}\})/gi, '$1}}');

        const matches = content.match(/\{\{blank_\d+\}\}/g) || ['{{blank_1}}'];
        const fillBlankAnswers = matches.map((_, mIdx) => ({
          blankIndex: mIdx + 1,
          answer: answerText || String(q.explanation || '').replace(/\{\{blank_\d+\}\}/gi, '').split('.')[0]?.trim() || '',
          acceptedAnswers: [],
          score: 0.25 / matches.length,
          caseSensitive: false,
          ignoreWhitespace: true,
          ignoreVietnameseTone: false,
        }));

        let cleanExp = String(q.explanation || '').replace(/\{\{blank_\d+\}\}/gi, '').trim();
        if (!cleanExp || cleanExp.includes('{{blank_')) {
          cleanExp = `Đáp án: ${answerText}`;
        }

        paired.push({
          ...q,
          content,
          fillBlankAnswers,
          explanation: cleanExp,
        });
      }
      return paired;
    }
  }

  return rawItems;
}

      // Unpack rawQuestions neu gap chuoi JSON bi dong goi thanh 1 phan tu duy nhat
      let unpacked: any[] = [];
      for (const item of rawQuestions) {
        if (item && typeof item === 'object' && typeof item.content === 'string' && (item.content.includes('"content"') || item.content.includes('"questions"'))) {
          const extracted = extractValidQuestionsFromTruncatedJson(item.content);
          if (extracted.length > 0) {
            unpacked.push(...extracted);
            continue;
          }
        }
        unpacked.push(item);
      }
      rawQuestions = pairQuestionsAndAnswers(unpacked, input.type);
      if (!isExtraction && input.count > 0 && rawQuestions.length > input.count) {
        rawQuestions = rawQuestions.slice(0, input.count);
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
        const isFillBlank = input.type === 'FILL_BLANK';
        const options: QuestionOptionDto[] = (Array.isArray(item.options) && !isEssay && !isFillBlank)
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
        let rawContentText = String(item.content || '').trim();

        // If rawContentText trapped trailing JSON payload (e.g. ","score":0.25,"explanation":...)
        if (rawContentText.includes('","score"') || rawContentText.includes('","explanation"') || rawContentText.includes('","options"') || rawContentText.includes('","fillBlankAnswers"')) {
          const expMatch = rawContentText.match(/","explanation"\s*:\s*"([^"]+)"/i);
          if (expMatch && (!item.explanation || !String(item.explanation).trim())) {
            item.explanation = expMatch[1];
          }
          const optMatch = rawContentText.match(/","options"\s*:\s*(\[[^\]]+\])/i);
          if (optMatch && (!item.options || !Array.isArray(item.options) || item.options.length === 0)) {
            try { item.options = JSON.parse(optMatch[1]); } catch { }
          }
          rawContentText = rawContentText.replace(/","(score|explanation|keywords|options|fillBlankAnswers|imageIndexes)":[\s\S]*/gi, '');
        }

        let formattedContent = rawContentText
          .replace(/^["']?questions["']?\s*:\s*\[\s*/i, '')
          .replace(/^[{["]+/g, '')
          .replace(/["]+$/g, '')
          .replace(/^["']?\s*content["']?\s*:\s*["']?/i, '')
          .trim();

        // Đảm bảo thẻ {{blank_1}} luôn có đầy đủ ngoặc nhọn đóng }}
        formattedContent = formattedContent.replace(/(\{\{blank_\d+)(?!\}\})/gi, '$1}}');

        let fillBlankAnswers = isFillBlank ? (Array.isArray(item.fillBlankAnswers) ? item.fillBlankAnswers.map((answer: any, index: number) => ({
          blankIndex: Number(answer.blankIndex || index + 1),
          answer: String(answer.answer || '')
            .replace(/\{\{blank_\d+\}\}/gi, '')
            .replace(/^(?:\d+[\s.:-]*|đáp\s*án\s*[:.-]?|answer\s*[:.-]?|key\s*[:.-]?)\s*/iu, '')
            .replace(/\{\{blank_\d+\}\}/gi, '')
            .replace(/^["'«“]+|["'»”]+$/g, '')
            .trim(),
          acceptedAnswers: Array.isArray(answer.acceptedAnswers) ? answer.acceptedAnswers.map(String) : [],
          score: Number(answer.score ?? Number(item.score || 0.25) / Math.max(1, item.fillBlankAnswers.length)),
          caseSensitive: Boolean(answer.caseSensitive),
          ignoreWhitespace: answer.ignoreWhitespace !== false,
          ignoreVietnameseTone: Boolean(answer.ignoreVietnameseTone)
        })) : []) : [];

        if (isFillBlank) {
          if (!formattedContent.includes('{{blank_')) {
            let bCount = 0;
            formattedContent = formattedContent.replace(/(?:\.\.\.|_{2,}|\[\s*\]|\(\s*\))/g, () => {
              bCount++;
              return `{{blank_${bCount}}}`;
            });
            if (bCount === 0) {
              formattedContent += ' {{blank_1}}';
              bCount = 1;
            }
          }
          formattedContent = formattedContent.replace(/(\{\{blank_\d+)(?!\}\})/gi, '$1}}');
          const matches = formattedContent.match(/\{\{blank_\d+\}\}/g) || [];
          if (matches.length > 0) {
            if (fillBlankAnswers.length === 0) {
              fillBlankAnswers = matches.map((_, idx) => ({
                blankIndex: idx + 1,
                answer: String(item.explanation || '').replace(/\{\{blank_\d+\}\}/gi, '').split('.')[0]?.trim() || '',
                acceptedAnswers: [],
                score: Number(item.score || 0.25) / matches.length,
                caseSensitive: false,
                ignoreWhitespace: true,
                ignoreVietnameseTone: false,
              }));
            } else {
              fillBlankAnswers.forEach((fa: any) => {
                fa.answer = String(fa.answer || '')
                  .replace(/\{\{blank_\d+\}\}/gi, '')
                  .replace(/^(?:\d+[\s.:-]*|đáp\s*án\s*[:.-]?|answer\s*[:.-]?|key\s*[:.-]?)\s*/iu, '')
                  .replace(/\{\{blank_\d+\}\}/gi, '')
                  .replace(/^["'«“]+|["'»”]+$/g, '')
                  .trim();
                if (!fa.answer && item.explanation) {
                  fa.answer = String(item.explanation).replace(/\{\{blank_\d+\}\}/gi, '').split('.')[0]?.trim() || '';
                }
              });
            }
          }
        }

        const imageIndexes = Array.isArray(item.imageIndexes) ? item.imageIndexes.filter((index: any) => Number.isInteger(index) && index >= 0 && index < (input.images || []).length) : [];
        const cleanExplanation = String(item.explanation || '').replace(/\{\{blank_\d+\}\}/gi, '').trim();
        questions.push({
          subjectId: input.subjectId,
          chapterId: input.chapterId,
          type: input.type,
          difficulty: input.difficulty,
          bloomLevel: input.bloomLevel,
          content: formattedContent,
          score: Number(item.score || 0.25),
          explanation: cleanExplanation,
          keywords: String(item.keywords || ''),
          options,
          fillBlankAnswers,
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
      if (error?.name === 'AbortError') {
        this.logger.warn(`Gemini phản hồi quá chậm (timeout ${timeout}ms)`);
        throw new BadGatewayException('Dịch vụ AI phản hồi quá chậm. Vui lòng thử lại sau.');
      }
      if (error instanceof SyntaxError) throw new BadGatewayException('Dữ liệu trả về từ AI không hợp lệ. Vui lòng thử lại.');
      this.logger.error(`Lỗi không xác định khi gọi Gemini: ${error?.message}`);
      throw new BadGatewayException('Không thể kết nối dịch vụ AI. Vui lòng thử lại sau.');
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
