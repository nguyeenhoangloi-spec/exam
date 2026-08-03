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
exports.ExamSupervisorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExamSupervisorsService = class ExamSupervisorsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assign(data) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id: data.teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Giảng viên không tồn tại.');
        }
        const scheduleRoom = await this.prisma.examScheduleRoom.findUnique({
            where: { id: data.examScheduleRoomId },
            include: {
                room: true,
                examSchedule: true,
                supervisors: true,
            },
        });
        if (!scheduleRoom) {
            throw new common_1.NotFoundException('Phòng thi của lịch thi không tồn tại.');
        }
        const alreadyInRoom = scheduleRoom.supervisors.some((s) => s.teacherId === data.teacherId);
        if (alreadyInRoom) {
            throw new common_1.BadRequestException(`Giảng viên ${teacher.fullName} đã được phân công coi thi ở phòng này.`);
        }
        if (scheduleRoom.supervisors.length >= 2) {
            throw new common_1.BadRequestException('Mỗi phòng thi không được phân công quá 2 giám thị.');
        }
        const conflictingSupervisors = await this.prisma.examSupervisor.findMany({
            where: {
                teacherId: data.teacherId,
                examScheduleRoom: {
                    examSchedule: {
                        examDate: scheduleRoom.examSchedule.examDate,
                        AND: [
                            { startTime: { lt: scheduleRoom.examSchedule.endTime } },
                            { endTime: { gt: scheduleRoom.examSchedule.startTime } },
                        ],
                    },
                },
            },
            include: {
                examScheduleRoom: {
                    include: { room: true },
                },
            },
        });
        if (conflictingSupervisors.length > 0) {
            const conflictRoom = conflictingSupervisors[0].examScheduleRoom.room.roomCode;
            throw new common_1.BadRequestException(`Giảng viên ${teacher.fullName} đã có lịch coi thi tại phòng ${conflictRoom} trong cùng khung giờ (${scheduleRoom.examSchedule.startTime} - ${scheduleRoom.examSchedule.endTime}).`);
        }
        return this.prisma.examSupervisor.create({
            data: {
                examScheduleRoomId: data.examScheduleRoomId,
                teacherId: data.teacherId,
                role: data.role || 'SUPERVISOR_1',
                note: data.note,
            },
            include: {
                teacher: true,
                examScheduleRoom: {
                    include: { room: true, examSchedule: { include: { subject: true } } },
                },
            },
        });
    }
    async remove(id) {
        const supervisor = await this.prisma.examSupervisor.findUnique({ where: { id } });
        if (!supervisor)
            throw new common_1.NotFoundException('Không tìm thấy bản ghi phân công giám thị.');
        return this.prisma.examSupervisor.delete({ where: { id } });
    }
    async getSupervisorsBySchedule(examScheduleId) {
        return this.prisma.examSupervisor.findMany({
            where: {
                examScheduleRoom: {
                    examScheduleId,
                },
            },
            include: {
                teacher: true,
                examScheduleRoom: {
                    include: { room: true },
                },
            },
        });
    }
};
exports.ExamSupervisorsService = ExamSupervisorsService;
exports.ExamSupervisorsService = ExamSupervisorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamSupervisorsService);
//# sourceMappingURL=exam-supervisors.service.js.map