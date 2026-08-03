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
exports.TeachersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let TeachersService = class TeachersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.teacher.findMany({
            include: {
                department: true,
                user: true,
            },
            orderBy: { teacherCode: 'asc' },
        });
    }
    async findOne(id) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id },
            include: {
                department: true,
                user: true,
                supervisors: {
                    include: {
                        examScheduleRoom: {
                            include: {
                                room: true,
                                examSchedule: {
                                    include: { subject: true, examPeriod: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!teacher)
            throw new common_1.NotFoundException('Không tìm thấy giảng viên.');
        return teacher;
    }
    async create(data) {
        const existingCode = await this.prisma.teacher.findUnique({
            where: { teacherCode: data.teacherCode },
        });
        if (existingCode)
            throw new common_1.BadRequestException('Mã giảng viên đã tồn tại.');
        const username = data.username || data.teacherCode;
        const rawPassword = data.password || '123456';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const user = await this.prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                email: data.email,
                role: 'TEACHER',
                status: 'ACTIVE',
            },
        });
        return this.prisma.teacher.create({
            data: {
                teacherCode: data.teacherCode,
                fullName: data.fullName,
                degree: data.degree,
                email: data.email,
                phone: data.phone,
                departmentId: data.departmentId,
                userId: user.id,
            },
            include: { department: true, user: true },
        });
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.teacher.update({
            where: { id },
            data,
            include: { department: true, user: true },
        });
    }
    async remove(id) {
        const teacher = await this.findOne(id);
        await this.prisma.teacher.delete({ where: { id } });
        if (teacher.userId) {
            await this.prisma.user.delete({ where: { id: teacher.userId } }).catch(() => { });
        }
        return { message: 'Đã xóa giảng viên thành công' };
    }
    async getMyAssignments(userId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { userId },
        });
        if (!teacher)
            throw new common_1.NotFoundException('Không tìm thấy thông tin giảng viên.');
        const assignments = await this.prisma.examSupervisor.findMany({
            where: { teacherId: teacher.id },
            include: {
                examScheduleRoom: {
                    include: {
                        room: true,
                        examSchedule: {
                            include: {
                                subject: true,
                                examPeriod: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                examScheduleRoom: {
                    examSchedule: {
                        examDate: 'asc',
                    },
                },
            },
        });
        return assignments.map((a) => ({
            id: a.id,
            role: a.role,
            note: a.note,
            subjectCode: a.examScheduleRoom.examSchedule.subject.subjectCode,
            subjectName: a.examScheduleRoom.examSchedule.subject.subjectName,
            examDate: a.examScheduleRoom.examSchedule.examDate,
            startTime: a.examScheduleRoom.examSchedule.startTime,
            endTime: a.examScheduleRoom.examSchedule.endTime,
            roomCode: a.examScheduleRoom.room.roomCode,
            roomName: a.examScheduleRoom.room.roomName,
            building: a.examScheduleRoom.room.building,
            periodName: a.examScheduleRoom.examSchedule.examPeriod.name,
        }));
    }
};
exports.TeachersService = TeachersService;
exports.TeachersService = TeachersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeachersService);
//# sourceMappingURL=teachers.service.js.map