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
exports.ExamArrangementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExamArrangementService = class ExamArrangementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async autoArrange(examScheduleId, roomIds) {
        if (!roomIds || roomIds.length === 0) {
            throw new common_1.BadRequestException('Vui lòng chọn ít nhất một phòng thi.');
        }
        const schedule = await this.prisma.examSchedule.findUnique({
            where: { id: examScheduleId },
            include: { subject: true, examPeriod: true },
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Không tìm thấy lịch thi.');
        }
        const studentSubjects = await this.prisma.studentSubject.findMany({
            where: {
                subjectId: schedule.subjectId,
                status: 'ELIGIBLE',
            },
            include: {
                student: {
                    include: { class: true },
                },
            },
            orderBy: {
                student: { studentCode: 'asc' },
            },
        });
        if (studentSubjects.length === 0) {
            throw new common_1.BadRequestException(`Không có sinh viên nào đăng ký và đủ điều kiện thi môn ${schedule.subject.subjectName}.`);
        }
        const students = studentSubjects.map((ss) => ss.student);
        const rooms = await this.prisma.examRoom.findMany({
            where: { id: { in: roomIds } },
        });
        if (rooms.length !== roomIds.length) {
            throw new common_1.BadRequestException('Một hoặc nhiều phòng thi được chọn không tồn tại.');
        }
        const overlappingScheduleRooms = await this.prisma.examScheduleRoom.findMany({
            where: {
                roomId: { in: roomIds },
                examScheduleId: { not: examScheduleId },
                examSchedule: {
                    examDate: schedule.examDate,
                    AND: [
                        { startTime: { lt: schedule.endTime } },
                        { endTime: { gt: schedule.startTime } },
                    ],
                },
            },
            include: { room: true, examSchedule: { include: { subject: true } } },
        });
        if (overlappingScheduleRooms.length > 0) {
            const busyRoomCodes = Array.from(new Set(overlappingScheduleRooms.map((osr) => osr.room.roomCode))).join(', ');
            throw new common_1.BadRequestException(`Phòng thi [${busyRoomCodes}] đã có lịch thi khác trùng khung giờ (${schedule.startTime} - ${schedule.endTime}).`);
        }
        const totalCapacity = rooms.reduce((acc, r) => acc + r.capacity, 0);
        if (totalCapacity < students.length) {
            throw new common_1.BadRequestException(`Tổng sức chứa của các phòng được chọn (${totalCapacity} chỗ) không đủ cho tổng số sinh viên (${students.length} sinh viên).`);
        }
        const existingScheduleRooms = await this.prisma.examScheduleRoom.findMany({
            where: { examScheduleId },
            select: { id: true },
        });
        const existingScheduleRoomIds = existingScheduleRooms.map((r) => r.id);
        if (existingScheduleRoomIds.length > 0) {
            await this.prisma.examSupervisor.deleteMany({
                where: { examScheduleRoomId: { in: existingScheduleRoomIds } },
            });
            await this.prisma.examRoomStudent.deleteMany({
                where: { examScheduleRoomId: { in: existingScheduleRoomIds } },
            });
            await this.prisma.examScheduleRoom.deleteMany({
                where: { examScheduleId },
            });
        }
        const arrangementResults = [];
        let studentIndex = 0;
        let currentSbdNumber = 1;
        for (const room of rooms) {
            if (studentIndex >= students.length)
                break;
            const scheduleRoom = await this.prisma.examScheduleRoom.create({
                data: {
                    examScheduleId,
                    roomId: room.id,
                },
            });
            const studentsInThisRoomCount = Math.min(room.capacity, students.length - studentIndex);
            for (let seat = 1; seat <= studentsInThisRoomCount; seat++) {
                const student = students[studentIndex++];
                const sbd = `SBD${String(currentSbdNumber++).padStart(4, '0')}`;
                const roomStudent = await this.prisma.examRoomStudent.create({
                    data: {
                        examScheduleRoomId: scheduleRoom.id,
                        studentId: student.id,
                        examNumber: sbd,
                        seatNumber: seat,
                        status: 'ASSIGNED',
                    },
                    include: {
                        student: { include: { class: true } },
                    },
                });
                arrangementResults.push({
                    id: roomStudent.id,
                    examNumber: roomStudent.examNumber,
                    seatNumber: roomStudent.seatNumber,
                    studentCode: student.studentCode,
                    fullName: student.fullName,
                    className: student.class.name,
                    roomCode: room.roomCode,
                    roomName: room.roomName,
                    building: room.building,
                });
            }
        }
        return {
            message: 'Xếp sinh viên vào phòng thi tự động thành công!',
            summary: {
                totalStudents: students.length,
                totalRoomsAssigned: rooms.length,
                subjectCode: schedule.subject.subjectCode,
                subjectName: schedule.subject.subjectName,
                examDate: schedule.examDate,
                timeSlot: `${schedule.startTime} - ${schedule.endTime}`,
            },
            details: arrangementResults,
        };
    }
    async getArrangementResults(examScheduleId) {
        const scheduleRooms = await this.prisma.examScheduleRoom.findMany({
            where: { examScheduleId },
            include: {
                room: true,
                examRoomStudents: {
                    include: {
                        student: { include: { class: true } },
                    },
                    orderBy: { seatNumber: 'asc' },
                },
                supervisors: {
                    include: { teacher: true },
                },
            },
        });
        return scheduleRooms;
    }
};
exports.ExamArrangementService = ExamArrangementService;
exports.ExamArrangementService = ExamArrangementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamArrangementService);
//# sourceMappingURL=exam-arrangement.service.js.map