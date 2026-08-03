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
exports.ExamPeriodsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExamPeriodsService = class ExamPeriodsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.examPeriod.findMany({
            include: {
                _count: { select: { examSchedules: true } },
            },
            orderBy: { startDate: 'desc' },
        });
    }
    async findOne(id) {
        const period = await this.prisma.examPeriod.findUnique({
            where: { id },
            include: { examSchedules: { include: { subject: true } } },
        });
        if (!period)
            throw new common_1.NotFoundException('Không tìm thấy kỳ thi.');
        return period;
    }
    async create(data) {
        return this.prisma.examPeriod.create({
            data: {
                name: data.name,
                semester: data.semester,
                schoolYear: data.schoolYear,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                status: data.status || 'UPCOMING',
            },
        });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.examPeriod.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.examPeriod.delete({ where: { id } });
    }
};
exports.ExamPeriodsService = ExamPeriodsService;
exports.ExamPeriodsService = ExamPeriodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamPeriodsService);
//# sourceMappingURL=exam-periods.service.js.map