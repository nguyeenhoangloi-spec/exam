"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiQuestionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const question_validation_1 = require("./question-validation");
let AiQuestionsService = class AiQuestionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generate(input) {
        const apiKey = process.env.GEMINI_API_KEY?.trim();
        if (!apiKey)
            throw new common_1.ServiceUnavailableException('Chưa cấu hình GEMINI_API_KEY. AI không thể tạo câu hỏi.');
        const chapter = await this.prisma.chapter.findFirst({
            where: { id: input.chapterId, subjectId: input.subjectId },
            include: { subject: true },
        });
        if (!chapter)
            throw new common_1.BadRequestException('Chương không thuộc môn học đã chọn.');
        const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
        const timeout = Number(process.env.GEMINI_TIMEOUT_MS || 30000);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        const prompt = [
            `Tạo đúng ${input.count} câu hỏi khảo thí bằng tiếng Việt.`,
            `Môn: ${chapter.subject.subjectName}; chương: ${chapter.name}.`,
            `Loại: ${input.type}; độ khó: ${input.difficulty}; Bloom: ${input.bloomLevel}.`,
            input.prompt ? `Ngữ cảnh: ${input.prompt}` : '',
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
            if (!response.ok)
                throw new common_1.BadGatewayException(`Gemini trả lỗi HTTP ${response.status}.`);
            const payload = await response.json();
            const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!raw)
                throw new common_1.BadGatewayException('Gemini không trả nội dung.');
            const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
            if (!Array.isArray(parsed.questions) || parsed.questions.length !== input.count) {
                throw new common_1.BadGatewayException('Kết quả AI không đúng số lượng yêu cầu.');
            }
            const questions = parsed.questions.map((item, index) => {
                if (typeof item.content !== 'string' || item.content.trim().length < 5) {
                    throw new common_1.BadGatewayException(`Câu AI thứ ${index + 1} không hợp lệ.`);
                }
                const options = Array.isArray(item.options)
                    ? item.options.map((option, order) => ({
                        label: String(option.label || String.fromCharCode(65 + order)),
                        content: String(option.content || ''),
                        isCorrect: Boolean(option.isCorrect),
                        order,
                    }))
                    : [];
                (0, question_validation_1.validateQuestionOptions)(input.type, options);
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
            const normalized = questions.map((q) => (0, question_validation_1.normalizeQuestionContent)(q.content));
            const existing = await this.prisma.question.findMany({
                where: { normalizedContent: { in: normalized }, deletedAt: null },
                select: { code: true, normalizedContent: true },
            });
            return questions.map((question) => ({
                ...question,
                duplicate: existing.find((row) => row.normalizedContent === (0, question_validation_1.normalizeQuestionContent)(question.content)) || null,
            }));
        }
        catch (error) {
            if (error instanceof common_1.BadGatewayException)
                throw error;
            if (error?.name === 'AbortError')
                throw new common_1.BadGatewayException(`Gemini hết thời gian chờ sau ${timeout}ms.`);
            if (error instanceof SyntaxError)
                throw new common_1.BadGatewayException('Gemini trả JSON không hợp lệ.');
            throw new common_1.BadGatewayException(error?.message || 'Không thể kết nối Gemini.');
        }
        finally {
            clearTimeout(timer);
        }
    }
};
exports.AiQuestionsService = AiQuestionsService;
exports.AiQuestionsService = AiQuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiQuestionsService);
//# sourceMappingURL=ai.service.js.map