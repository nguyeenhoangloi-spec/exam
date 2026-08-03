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
exports.ExamRoomsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExamRoomsService = class ExamRoomsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.examRoom.findMany({
            orderBy: { roomCode: 'asc' },
        });
    }
    async findOne(id) {
        const room = await this.prisma.examRoom.findUnique({
            where: { id },
        });
        if (!room)
            throw new common_1.NotFoundException('Không tìm thấy phòng thi.');
        return room;
    }
    async create(data) {
        const existing = await this.prisma.examRoom.findUnique({
            where: { roomCode: data.roomCode },
        });
        if (existing)
            throw new common_1.BadRequestException('Mã phòng thi đã tồn tại.');
        return this.prisma.examRoom.create({ data });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.examRoom.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.examRoom.delete({ where: { id } });
    }
};
exports.ExamRoomsService = ExamRoomsService;
exports.ExamRoomsService = ExamRoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamRoomsService);
//# sourceMappingURL=exam-rooms.service.js.map