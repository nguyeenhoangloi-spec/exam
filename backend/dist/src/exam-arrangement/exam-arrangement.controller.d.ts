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
                studentCode: string;
                userId: number;
                fullName: string;
                gender: string;
                dateOfBirth: Date;
                phone: string | null;
                classId: number;
            };
        } & {
            id: number;
            status: string;
            studentId: number;
            examScheduleRoomId: number;
            examNumber: string;
            seatNumber: number;
        })[];
        supervisors: ({
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
        } & {
            id: number;
            role: string;
            note: string | null;
            examScheduleRoomId: number;
            teacherId: number;
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
