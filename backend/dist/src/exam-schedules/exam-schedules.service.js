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
exports.ExamSchedulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExamSchedulesService = class ExamSchedulesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(examPeriodId) {
        const where = {};
        if (examPeriodId)
            where.examPeriodId = examPeriodId;
        return this.prisma.examSchedule.findMany({
            where,
            include: {
                examPeriod: true,
                subject: true,
                examScheduleRooms: {
                    include: {
                        room: true,
                        _count: { select: { examRoomStudents: true, supervisors: true } },
                    },
                },
            },
            orderBy: { examDate: 'asc' },
        });
    }
    async findOne(id) {
        const schedule = await this.prisma.examSchedule.findUnique({
            where: { id },
            include: {
                examPeriod: true,
                subject: true,
                examScheduleRooms: {
                    include: {
                        room: true,
                        supervisors: { include: { teacher: true } },
                        examRoomStudents: { include: { student: { include: { class: true } } } },
                    },
                },
                examPapers: true,
            },
        });
        if (!schedule)
            throw new common_1.NotFoundException('Không tìm thấy lịch thi.');
        return schedule;
    }
    async create(data) {
        if (data.startTime >= data.endTime) {
            throw new common_1.BadRequestException('Thời gian kết thúc (endTime) phải lớn hơn thời gian bắt đầu (startTime).');
        }
        const subject = await this.prisma.subject.findUnique({
            where: { id: data.subjectId },
        });
        if (!subject) {
            throw new common_1.BadRequestException('Môn học được chọn không tồn tại.');
        }
        const period = await this.prisma.examPeriod.findUnique({
            where: { id: data.examPeriodId },
        });
        if (!period) {
            throw new common_1.BadRequestException('Kỳ thi được chọn không tồn tại.');
        }
        const examDate = new Date(data.examDate);
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        examDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        if (examDate < startDate || examDate > endDate) {
            throw new common_1.BadRequestException(`Ngày thi (${data.examDate}) phải nằm trong khoảng thời gian kỳ thi (${period.startDate.toISOString().split('T')[0]} đến ${period.endDate.toISOString().split('T')[0]}).`);
        }
        return this.prisma.examSchedule.create({
            data: {
                examPeriodId: data.examPeriodId,
                subjectId: data.subjectId,
                examDate: new Date(data.examDate),
                startTime: data.startTime,
                endTime: data.endTime,
                examType: data.examType || 'TRAC_NGHIEM',
                status: data.status || 'SCHEDULED',
                note: data.note,
            },
            include: {
                examPeriod: true,
                subject: true,
            },
        });
    }
    async update(id, data) {
        const existing = await this.findOne(id);
        const startTime = data.startTime || existing.startTime;
        const endTime = data.endTime || existing.endTime;
        if (startTime >= endTime) {
            throw new common_1.BadRequestException('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
        }
        if (data.examPeriodId || data.examDate) {
            const periodId = data.examPeriodId || existing.examPeriodId;
            const period = await this.prisma.examPeriod.findUnique({ where: { id: periodId } });
            if (period) {
                const examDate = new Date(data.examDate || existing.examDate);
                const startDate = new Date(period.startDate);
                const endDate = new Date(period.endDate);
                examDate.setHours(0, 0, 0, 0);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                if (examDate < startDate || examDate > endDate) {
                    throw new common_1.BadRequestException('Ngày thi nằm ngoài khoảng thời gian của kỳ thi.');
                }
            }
        }
        return this.prisma.examSchedule.update({
            where: { id },
            data: {
                ...data,
                examDate: data.examDate ? new Date(data.examDate) : undefined,
            },
            include: { examPeriod: true, subject: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.examSchedule.delete({ where: { id } });
    }
};
exports.ExamSchedulesService = ExamSchedulesService;
exports.ExamSchedulesService = ExamSchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamSchedulesService);
//# sourceMappingURL=exam-schedules.service.js.map