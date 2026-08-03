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
exports.QuestionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let QuestionsService = class QuestionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query?.subjectId)
            where.subjectId = Number(query.subjectId);
        if (query?.chapter)
            where.chapter = Number(query.chapter);
        if (query?.difficulty)
            where.difficulty = query.difficulty;
        if (query?.status)
            where.status = query.status;
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
    async findOne(id) {
        const question = await this.prisma.question.findUnique({
            where: { id },
            include: {
                subject: true,
                options: true,
                createdBy: { select: { id: true, username: true, role: true } },
            },
        });
        if (!question)
            throw new common_1.NotFoundException('Không tìm thấy câu hỏi.');
        return question;
    }
    async create(userId, data) {
        if (!data.options || data.options.length < 2) {
            throw new common_1.BadRequestException('Câu hỏi trắc nghiệm phải có ít nhất 2 phương án lựa chọn.');
        }
        const questionType = data.questionType || 'SINGLE_CHOICE';
        if (questionType === 'SINGLE_CHOICE') {
            const correctCount = data.options.filter((opt) => opt.isCorrect).length;
            if (correctCount !== 1) {
                throw new common_1.BadRequestException('Câu hỏi chọn 1 đáp án (SINGLE_CHOICE) phải có duy nhất 1 đáp án đúng.');
            }
        }
        const subject = await this.prisma.subject.findUnique({ where: { id: data.subjectId } });
        if (!subject)
            throw new common_1.NotFoundException('Môn học không tồn tại.');
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
    async update(id, data) {
        await this.findOne(id);
        if (data.options) {
            if (data.options.length < 2) {
                throw new common_1.BadRequestException('Câu hỏi trắc nghiệm phải có ít nhất 2 phương án lựa chọn.');
            }
            const questionType = data.questionType || 'SINGLE_CHOICE';
            if (questionType === 'SINGLE_CHOICE') {
                const correctCount = data.options.filter((opt) => opt.isCorrect).length;
                if (correctCount !== 1) {
                    throw new common_1.BadRequestException('Câu hỏi chọn 1 đáp án phải có đúng 1 đáp án đúng.');
                }
            }
            await this.prisma.questionOption.deleteMany({ where: { questionId: id } });
        }
        const { options, ...questionData } = data;
        return this.prisma.question.update({
            where: { id },
            data: {
                ...questionData,
                options: options
                    ? {
                        create: options.map((opt) => ({
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
    async approve(id, status = 'APPROVED') {
        await this.findOne(id);
        return this.prisma.question.update({
            where: { id },
            data: { status },
            include: { subject: true, options: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.question.delete({ where: { id } });
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map