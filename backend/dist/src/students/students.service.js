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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let StudentsService = class StudentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(search) {
        const where = {};
        if (search) {
            where.OR = [
                { studentCode: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.student.findMany({
            where,
            include: {
                class: { include: { department: true } },
                user: true,
            },
            orderBy: { studentCode: 'asc' },
        });
    }
    async findOne(id) {
        const student = await this.prisma.student.findUnique({
            where: { id },
            include: {
                class: { include: { department: true } },
                user: true,
                studentSubjects: { include: { subject: true } },
            },
        });
        if (!student)
            throw new common_1.NotFoundException('Không tìm thấy sinh viên.');
        return student;
    }
    async create(data) {
        const existingCode = await this.prisma.student.findUnique({
            where: { studentCode: data.studentCode },
        });
        if (existingCode)
            throw new common_1.BadRequestException('Mã sinh viên đã tồn tại.');
        const username = data.username || data.studentCode;
        const rawPassword = data.password || '123456';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const user = await this.prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                email: data.email,
                role: 'STUDENT',
                status: 'ACTIVE',
            },
        });
        return this.prisma.student.create({
            data: {
                studentCode: data.studentCode,
                fullName: data.fullName,
                gender: data.gender,
                dateOfBirth: new Date(data.dateOfBirth),
                email: data.email,
                phone: data.phone,
                classId: data.classId,
                userId: user.id,
            },
            include: { class: true, user: true },
        });
    }
    async update(id, data) {
        const student = await this.findOne(id);
        return this.prisma.student.update({
            where: { id },
            data: {
                fullName: data.fullName,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
                email: data.email,
                phone: data.phone,
                classId: data.classId,
            },
            include: { class: true, user: true },
        });
    }
    async remove(id) {
        const student = await this.findOne(id);
        await this.prisma.student.delete({ where: { id } });
        if (student.userId) {
            await this.prisma.user.delete({ where: { id: student.userId } }).catch(() => { });
        }
        return { message: 'Đã xóa sinh viên thành công' };
    }
    async getPersonalSchedule(userId) {
        const student = await this.prisma.student.findUnique({
            where: { userId },
        });
        if (!student)
            throw new common_1.NotFoundException('Không tìm thấy thông tin sinh viên.');
        const roomStudents = await this.prisma.examRoomStudent.findMany({
            where: { studentId: student.id },
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
        return roomStudents.map((rs) => ({
            id: rs.id,
            examNumber: rs.examNumber,
            seatNumber: rs.seatNumber,
            status: rs.status,
            subjectCode: rs.examScheduleRoom.examSchedule.subject.subjectCode,
            subjectName: rs.examScheduleRoom.examSchedule.subject.subjectName,
            credits: rs.examScheduleRoom.examSchedule.subject.credits,
            examDate: rs.examScheduleRoom.examSchedule.examDate,
            startTime: rs.examScheduleRoom.examSchedule.startTime,
            endTime: rs.examScheduleRoom.examSchedule.endTime,
            examType: rs.examScheduleRoom.examSchedule.examType,
            roomCode: rs.examScheduleRoom.room.roomCode,
            roomName: rs.examScheduleRoom.room.roomName,
            building: rs.examScheduleRoom.room.building,
            periodName: rs.examScheduleRoom.examSchedule.examPeriod.name,
        }));
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentsService);
//# sourceMappingURL=students.service.js.map