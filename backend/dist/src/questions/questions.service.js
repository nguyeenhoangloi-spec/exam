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
const question_validation_1 = require("./question-validation");
let QuestionsService = class QuestionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(actor, query) {
        const where = {};
        if (query?.subjectId)
            where.subjectId = Number(query.subjectId);
        if (query?.chapter)
            where.chapter = Number(query.chapter);
        if (query?.difficulty)
            where.difficulty = query.difficulty;
        if (query?.status)
            where.status = query.status;
        if (query?.search) {
            where.content = { contains: query.search };
        }
        return this.prisma.question.findMany({
            where,
            include: {
                subject: true,
                options: true,
                createdBy: { select: { id: true, username: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(actor, id) {
        const question = await this.prisma.question.findUnique({
            where: { id: Number(id) },
            include: {
                subject: true,
                options: true,
                createdBy: { select: { id: true, username: true } },
            },
        });
        if (!question)
            throw new common_1.NotFoundException('Không tìm thấy câu hỏi.');
        return question;
    }
    async create(actor, data) {
        if (!['ADMIN', 'TEACHER'].includes(actor.role)) {
            throw new common_1.ForbiddenException('Bạn không có quyền tạo câu hỏi.');
        }
        const options = data.options || [];
        (0, question_validation_1.validateQuestionOptions)(data.questionType || 'SINGLE_CHOICE', options);
        return this.prisma.question.create({
            data: {
                subjectId: Number(data.subjectId),
                chapter: Number(data.chapter || 1),
                content: data.content,
                questionType: data.questionType || 'SINGLE_CHOICE',
                difficulty: data.difficulty || 'MEDIUM',
                score: Number(data.score || 0.25),
                explanation: data.explanation || null,
                status: actor.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
                createdById: actor.id,
                options: {
                    create: options.map((opt) => ({
                        optionLabel: opt.optionLabel || opt.label || 'A',
                        optionContent: opt.optionContent || opt.content || '',
                        isCorrect: Boolean(opt.isCorrect),
                    })),
                },
            },
            include: {
                subject: true,
                options: true,
            },
        });
    }
    async update(actor, id, data) {
        await this.findOne(actor, id);
        if (data.options) {
            (0, question_validation_1.validateQuestionOptions)(data.questionType || 'SINGLE_CHOICE', data.options);
            await this.prisma.questionOption.deleteMany({ where: { questionId: Number(id) } });
        }
        const updateData = {};
        if (data.subjectId)
            updateData.subjectId = Number(data.subjectId);
        if (data.chapter)
            updateData.chapter = Number(data.chapter);
        if (data.content)
            updateData.content = data.content;
        if (data.questionType)
            updateData.questionType = data.questionType;
        if (data.difficulty)
            updateData.difficulty = data.difficulty;
        if (data.score !== undefined)
            updateData.score = Number(data.score);
        if (data.explanation !== undefined)
            updateData.explanation = data.explanation;
        if (data.status)
            updateData.status = data.status;
        if (data.options) {
            updateData.options = {
                create: data.options.map((opt) => ({
                    optionLabel: opt.optionLabel || opt.label || 'A',
                    optionContent: opt.optionContent || opt.content || '',
                    isCorrect: Boolean(opt.isCorrect),
                })),
            };
        }
        return this.prisma.question.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                subject: true,
                options: true,
            },
        });
    }
    async approve(actor, id, status = 'APPROVED') {
        if (actor.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Chỉ ADMIN mới có quyền duyệt câu hỏi.');
        }
        await this.findOne(actor, id);
        return this.prisma.question.update({
            where: { id: Number(id) },
            data: {
                status,
                approvedById: actor.id,
            },
        });
    }
    async remove(actor, id) {
        await this.findOne(actor, id);
        return this.prisma.question.delete({ where: { id: Number(id) } });
    }
    async saveBatch(actor, data) {
        if (!data.questions || !Array.isArray(data.questions)) {
            throw new common_1.BadRequestException('Danh sách câu hỏi không hợp lệ.');
        }
        const createdList = [];
        for (const item of data.questions) {
            const created = await this.create(actor, item);
            createdList.push(created);
        }
        return createdList;
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map