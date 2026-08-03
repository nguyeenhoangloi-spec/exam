import { PrismaService } from '../prisma/prisma.service';
export declare class ExamSupervisorsService {
    private prisma;
    constructor(prisma: PrismaService);
    assign(data: {
        examScheduleRoomId: number;
        teacherId: number;
        role?: string;
        note?: string;
    }): Promise<{
        teacher: {
            id: number;
            email: string;
            departmentId: number;
            userId: number;
            fullName: string;
            phone: string | null;
            teacherCode: string;
            degree: string;
        };
        examScheduleRoom: {
            examSchedule: {
                subject: {
                    id: number;
                    departmentId: number;
                    subjectCode: string;
                    subjectName: string;
                    credits: number;
                };
            } & {
                id: number;
                status: string;
                subjectId: number;
                examDate: Date;
                startTime: string;
                endTime: string;
                examType: string;
                note: string | null;
                examPeriodId: number;
            };
            room: {
                id: number;
                status: string;
                roomCode: string;
                roomName: string;
                building: string;
                capacity: number;
                roomType: string;
            };
        } & {
            id: number;
            examScheduleId: number;
            roomId: number;
        };
    } & {
        id: number;
        role: string;
        note: string | null;
        examScheduleRoomId: number;
        teacherId: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        role: string;
        note: string | null;
        examScheduleRoomId: number;
        teacherId: number;
    }>;
    getSupervisorsBySchedule(examScheduleId: number): Promise<({
        teacher: {
            id: number;
            email: string;
            departmentId: number;
            userId: number;
            fullName: string;
            phone: string | null;
            teacherCode: string;
            degree: string;
        };
        examScheduleRoom: {
            room: {
                id: number;
                status: string;
                roomCode: string;
                roomName: string;
                building: string;
                capacity: number;
                roomType: string;
            };
        } & {
            id: number;
            examScheduleId: number;
            roomId: number;
        };
    } & {
        id: number;
        role: string;
        note: string | null;
        examScheduleRoomId: number;
        teacherId: number;
    })[]>;
}
