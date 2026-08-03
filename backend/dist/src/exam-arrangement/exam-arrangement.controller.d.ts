import { ExamArrangementService } from './exam-arrangement.service';
export declare class ExamArrangementController {
    private readonly examArrangementService;
    constructor(examArrangementService: ExamArrangementService);
    autoArrange(body: {
        examScheduleId: number;
        roomIds: number[];
    }): Promise<{
        message: string;
        summary: {
            totalStudents: number;
            totalRoomsAssigned: number;
            subjectCode: string;
            subjectName: string;
            examDate: Date;
            timeSlot: string;
        };
        details: any[];
    }>;
    getResults(examScheduleId: number): Promise<({
        supervisors: ({
            teacher: {
                id: number;
                email: string;
                departmentId: number;
                teacherCode: string;
                userId: number;
                fullName: string;
                degree: string;
                phone: string | null;
            };
        } & {
            id: number;
            role: string;
            note: string | null;
            examScheduleRoomId: number;
            teacherId: number;
        })[];
        examRoomStudents: ({
            student: {
                class: {
                    id: number;
                    name: string;
                    code: string;
                    departmentId: number;
                };
            } & {
                id: number;
                email: string;
                userId: number;
                fullName: string;
                phone: string | null;
                studentCode: string;
                gender: string;
                dateOfBirth: Date;
                classId: number;
            };
        } & {
            id: number;
            status: string;
            examScheduleRoomId: number;
            studentId: number;
            examNumber: string;
            seatNumber: number;
        })[];
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
    })[]>;
}
