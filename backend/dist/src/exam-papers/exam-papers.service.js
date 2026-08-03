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
exports.ExamPapersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExamPapersService = class ExamPapersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRandom(userId, data) {
        return this.prisma.$transaction(async (tx) => {
            const schedule = await tx.examSchedule.findUnique({
                where: { id: data.examScheduleId },
                include: { subject: true },
            });
            if (!schedule) {
                throw new common_1.NotFoundException('Không tìm thấy lịch thi.');
            }
            const subjectId = schedule.subjectId;
            const approvedQuestions = await tx.question.findMany({
                where: {
                    subjectId,
                    status: 'APPROVED',
                },
                include: { options: true },
            });
            const easyQuestions = approvedQuestions.filter((q) => q.difficulty === 'EASY');
            const mediumQuestions = approvedQuestions.filter((q) => q.difficulty === 'MEDIUM');
            const hardQuestions = approvedQuestions.filter((q) => q.difficulty === 'HARD');
            if (easyQuestions.length < data.easyCount) {
                throw new common_1.BadRequestException(`Ngân hàng câu hỏi không đủ câu dễ (EASY). Yêu cầu: ${data.easyCount}, hiện có: ${easyQuestions.length} câu đã duyệt.`);
            }
            if (mediumQuestions.length < data.mediumCount) {
                throw new common_1.BadRequestException(`Ngân hàng câu hỏi không đủ câu trung bình (MEDIUM). Yêu cầu: ${data.mediumCount}, hiện có: ${mediumQuestions.length} câu đã duyệt.`);
            }
            if (hardQuestions.length < data.hardCount) {
                throw new common_1.BadRequestException(`Ngân hàng câu hỏi không đủ câu khó (HARD). Yêu cầu: ${data.hardCount}, hiện có: ${hardQuestions.length} câu đã duyệt.`);
            }
            const shuffleArray = (array) => {
                const arr = [...array];
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            };
            const selectedEasy = shuffleArray(easyQuestions).slice(0, data.easyCount);
            const selectedMedium = shuffleArray(mediumQuestions).slice(0, data.mediumCount);
            const selectedHard = shuffleArray(hardQuestions).slice(0, data.hardCount);
            const selectedQuestions = [...selectedEasy, ...selectedMedium, ...selectedHard];
            const shuffledFinalQuestions = shuffleArray(selectedQuestions);
            const totalScore = shuffledFinalQuestions.reduce((acc, q) => acc + (q.score || 0.25), 0);
            const title = data.title || `Đề thi môn ${schedule.subject.subjectName} - Mã đề ${data.paperCode}`;
            const examPaper = await tx.examPaper.create({
                data: {
                    examScheduleId: data.examScheduleId,
                    paperCode: data.paperCode,
                    title,
                    durationMinutes: data.durationMinutes || 60,
                    totalScore,
                    createdById: userId,
                    questions: {
                        create: shuffledFinalQuestions.map((q, index) => ({
                            questionId: q.id,
                            questionOrder: index + 1,
                            score: q.score || 0.25,
                        })),
                    },
                },
                include: {
                    examSchedule: { include: { subject: true } },
                    questions: {
                        include: {
                            question: { include: { options: true } },
                        },
                        orderBy: { questionOrder: 'asc' },
                    },
                },
            });
            return examPaper;
        });
    }
    async findAll(examScheduleId) {
        const where = {};
        if (examScheduleId)
            where.examScheduleId = examScheduleId;
        return this.prisma.examPaper.findMany({
            where,
            include: {
                examSchedule: { include: { subject: true } },
                createdBy: { select: { id: true, username: true } },
                _count: { select: { questions: true } },
            },
            orderBy: { id: 'desc' },
        });
    }
    async findOne(id) {
        const paper = await this.prisma.examPaper.findUnique({
            where: { id },
            include: {
                examSchedule: { include: { subject: true, examPeriod: true } },
                createdBy: { select: { id: true, username: true } },
                questions: {
                    include: {
                        question: { include: { options: true } },
                    },
                    orderBy: { questionOrder: 'asc' },
                },
            },
        });
        if (!paper)
            throw new common_1.NotFoundException('Không tìm thấy đề thi.');
        return paper;
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.examPaper.delete({ where: { id } });
    }
};
exports.ExamPapersService = ExamPapersService;
exports.ExamPapersService = ExamPapersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamPapersService);
//# sourceMappingURL=exam-papers.service.js.map