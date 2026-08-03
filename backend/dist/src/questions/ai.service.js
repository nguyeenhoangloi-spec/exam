"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiQuestionsService = void 0;
const common_1 = require("@nestjs/common");
const mammoth = require("mammoth");
const pdfModule = require("pdf-parse");
let AiQuestionsService = class AiQuestionsService {
    async extractDocument(file) {
        const name = String(file?.originalname || '').toLowerCase();
        if (name.endsWith('.docx'))
            return (await mammoth.extractRawText({ buffer: file.buffer })).value;
        if (name.endsWith('.pdf'))
            return (await (pdfModule.default || pdfModule)(file.buffer)).text;
        throw new common_1.BadRequestException('Chỉ hỗ trợ file Word (.docx) hoặc PDF (.pdf).');
    }
    async generate(input) {
        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (geminiKey) {
            const envModel = (process.env.GEMINI_MODEL || '').trim().toLowerCase().replace(/\s+/g, '-');
            const modelsToTry = [
                envModel,
                'gemini-3.6-flash',
                'gemini-flash-latest',
                'gemini-3.5-flash',
                'gemini-2.0-flash-lite',
            ].filter((m, i, arr) => m && arr.indexOf(m) === i);
            const instruction = `Tạo câu hỏi trắc nghiệm tiếng Việt. Trả duy nhất JSON dạng {"questions":[{"content":"...","options":[{"optionLabel":"A","optionContent":"...","isCorrect":true}],"explanation":"..."}]}. Mỗi câu đúng 4 đáp án (A, B, C, D) và có duy nhất 1 đáp án đúng. Môn học: ${input.subject}; chương: ${input.chapter}; số lượng: ${input.count}; độ khó: ${input.difficulty}; tài liệu tham khảo: ${input.prompt}`;
            for (const model of modelsToTry) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: instruction }] }],
                            generationConfig: { responseMimeType: 'application/json' },
                        }),
                    });
                    if (response.ok) {
                        const data = await response.json();
                        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"questions":[]}';
                        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                        const jsonResult = JSON.parse(rawText);
                        if (jsonResult.questions && jsonResult.questions.length > 0) {
                            return jsonResult.questions;
                        }
                    }
                }
                catch (e) {
                }
            }
        }
        return this.generateLocalFallbackQuestions(input);
    }
    generateLocalFallbackQuestions(input) {
        const rawLines = input.prompt
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 15);
        const questions = [];
        const count = Math.max(1, Math.min(input.count || 5, 20));
        for (let i = 0; i < count; i++) {
            const lineSample = rawLines[i % Math.max(1, rawLines.length)] || `Kiến thức tổng hợp chương ${input.chapter} môn ${input.subject}`;
            const concepts = [
                `Khái niệm cơ bản và nguyên lý về ${input.subject}`,
                `Ứng dụng và đặc điểm quan trọng của ${input.subject}`,
                `Phương pháp triển khai và tối ưu trong ${input.subject}`,
                `Quy trình xử lý chuẩn đối với ${input.subject}`,
                `Ràng buộc và quy tắc cốt lõi trong ${input.subject}`,
            ];
            const concept = concepts[i % concepts.length];
            const questionText = lineSample.length > 30
                ? `Nội dung nào sau đây mô tả đúng nhất về: "${lineSample.slice(0, 70)}..."?`
                : `Trong môn ${input.subject} (Chương ${input.chapter}), yếu tố nào đóng vai trò ${concept.toLowerCase()}?`;
            questions.push({
                content: questionText,
                options: [
                    { optionLabel: 'A', optionContent: `${concept} được áp dụng chính xác theo tiêu chuẩn.`, isCorrect: true },
                    { optionLabel: 'B', optionContent: `Bỏ qua các nguyên tắc đóng gói và ràng buộc dữ liệu.`, isCorrect: false },
                    { optionLabel: 'C', optionContent: `Chỉ áp dụng trong môi trường thử nghiệm đơn lẻ.`, isCorrect: false },
                    { optionLabel: 'D', optionContent: `Không cần tuân thủ cấu trúc dữ liệu ban đầu.`, isCorrect: false },
                ],
                explanation: `Định nghĩa chính xác theo kiến thức ${input.subject} chương ${input.chapter}.`,
            });
        }
        return questions;
    }
};
exports.AiQuestionsService = AiQuestionsService;
exports.AiQuestionsService = AiQuestionsService = __decorate([
    (0, common_1.Injectable)()
], AiQuestionsService);
//# sourceMappingURL=ai.service.js.map