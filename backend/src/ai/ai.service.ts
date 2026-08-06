import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { GenerateQuestionDto, GradeEssayDto } from './dto/ai.dto';

export interface AiGenerationResult {
  text: string;
  providerUsed: 'GEMINI' | 'DEEPSEEK';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly deepseekProvider: DeepSeekProvider,
  ) {}

  async generateWithFallback(prompt: string, systemPrompt?: string): Promise<AiGenerationResult> {
    try {
      const text = await this.geminiProvider.generateText(prompt, { systemPrompt });
      return { text, providerUsed: 'GEMINI' };
    } catch (geminiErr: any) {
      this.logger.warn(
        `Gemini provider failed (${geminiErr?.message || geminiErr}). Fallback -> Triggering DeepSeek Provider...`,
      );
      try {
        const text = await this.deepseekProvider.generateText(prompt, { systemPrompt });
        return { text, providerUsed: 'DEEPSEEK' };
      } catch (deepseekErr: any) {
        this.logger.error(
          `Both Gemini and DeepSeek providers failed. Gemini: ${geminiErr?.message}, DeepSeek: ${deepseekErr?.message}`,
        );
        throw new ServiceUnavailableException(
          `Hệ thống AI không phản hồi (Gemini: ${geminiErr?.message || 'Error'}, DeepSeek: ${deepseekErr?.message || 'Error'})`,
        );
      }
    }
  }

  private cleanJsonResponse(rawText: string): string {
    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```$/, '');
    }
    return clean.trim();
  }

  async gradeEssay(dto: GradeEssayDto) {
    const systemPrompt = `Bạn là một trợ lý giảng viên chấm bài thi tự luận chuyên nghiệp và công bằng.
Nhiệm vụ của bạn là đọc đề bài, bài làm của sinh viên và danh sách các tiêu chí chấm (Rubric).
Sau đó đưa ra điểm số phù hợp cho từng tiêu chí và nhận xét ngắn gọn, mang tính xây dựng bằng Tiếng Việt.
BẮT BUỘC chỉ trả về định dạng JSON thuần túy (không kèm chuỗi giải thích ngoài JSON).`;

    const rubricText = dto.criteria
      .map(
        (c, idx) =>
          `${idx + 1}. [ID: ${c.criterionId}] Tên tiêu chí: "${c.label}" (Điểm tối đa: ${c.maxScore})${c.description ? ` - Mô tả: ${c.description}` : ''}`,
      )
      .join('\n');

    const userPrompt = `ĐỀ BÀI:
${dto.questionText}

BÀI LÀM CỦA SINH VIÊN:
${dto.answerText}

DANH SÁCH TIÊU CHÍ CHẤM (RUBRIC):
${rubricText}

Vui lòng chấm điểm và trả về kết quả theo cấu trúc JSON như sau:
{
  "criteriaGrades": [
    {
      "criterionId": "string (khớp chính xác với ID tiêu chí)",
      "score": number (không âm, không quá điểm tối đa của tiêu chí),
      "comment": "nhận xét chi tiết ngắn gọn"
    }
  ],
  "totalScore": number,
  "generalFeedback": "nhận xét tổng quan bài làm"
}`;

    const result = await this.generateWithFallback(userPrompt, systemPrompt);
    const cleaned = this.cleanJsonResponse(result.text);

    try {
      const parsed = JSON.parse(cleaned);
      return {
        ...parsed,
        providerUsed: result.providerUsed,
      };
    } catch (e) {
      this.logger.error(`Failed to parse AI json output: ${cleaned}`);
      return {
        rawOutput: result.text,
        providerUsed: result.providerUsed,
        error: 'Không thể định dạng đầu ra AI thành JSON chuẩn',
      };
    }
  }

  async generateQuestions(dto: GenerateQuestionDto) {
    const systemPrompt = `Bạn là một chuyên gia ra đề thi trắc nghiệm và tự luận chuẩn hóa cho các môn học đại học.
Nhiệm vụ của bạn là tạo các câu hỏi chất lượng cao bằng Tiếng Việt dựa theo yêu cầu đầu vào.
BẮT BUỘC chỉ trả về kết quả dưới dạng JSON thuần túy.`;

    const userPrompt = `Hãy tạo ${dto.count} câu hỏi môn "${dto.subjectName}", chủ đề "${dto.topic}", loại câu hỏi: ${dto.type}, độ khó: ${dto.difficulty || 'MEDIUM'}.

Cấu trúc JSON yêu cầu:
{
  "questions": [
    {
      "content": "Nội dung câu hỏi",
      "type": "${dto.type}",
      "score": 1.0,
      "explanation": "Giải thích chi tiết đáp án",
      "options": [ // Nếu là MULTIPLE_CHOICE thì liệt kê 4 lựa chọn, ngược lại bỏ trống []
        { "content": "Lựa chọn A", "isCorrect": true },
        { "content": "Lựa chọn B", "isCorrect": false },
        { "content": "Lựa chọn C", "isCorrect": false },
        { "content": "Lựa chọn D", "isCorrect": false }
      ]
    }
  ]
}`;

    const result = await this.generateWithFallback(userPrompt, systemPrompt);
    const cleaned = this.cleanJsonResponse(result.text);

    try {
      const parsed = JSON.parse(cleaned);
      return {
        ...parsed,
        providerUsed: result.providerUsed,
      };
    } catch (e) {
      this.logger.error(`Failed to parse AI json output: ${cleaned}`);
      return {
        rawOutput: result.text,
        providerUsed: result.providerUsed,
        error: 'Không thể định dạng đầu ra AI thành JSON chuẩn',
      };
    }
  }
}
