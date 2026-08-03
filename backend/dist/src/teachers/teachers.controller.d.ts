import { TeachersService } from './teachers.service';
export declare class TeachersController {
    private readonly teachersService;
    constructor(teachersService: TeachersService);
    getMyAssignments(req: any): Promise<{
        id: number;
        role: string;
        note: string;
        subjectCode: string;
        subjectName: string;
        examDate: Date;
        startTime: string;
        endTime: string;
        roomCode: string;
        roomName: string;
        building: string;
        periodName: string;
    }[]>;
    findAll(): Promise<({
        user: {
            id: number;
            username: string;
            email: string;
            password: string;
            role: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
        department: {
            id: number;
            name: string;
            code: string;
        };
    } & {
        id: number;
        email: string;
        departmentId: number;
        userId: number;
        fullName: string;
        phone: string | null;
        teacherCode: string;
        degree: string;
    })[]>;
    findOne(id: number): Promise<{
        user: {
            id: number;
            username: string;
            email: string;
            password: string;
            role: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
        department: {
            id: number;
            name: string;
            code: string;
        };
        supervisors: ({
            examScheduleRoom: {
                examSchedule: {
                    subject: {
                        id: number;
                        departmentId: number;
                        subjectCode: string;
                        subjectName: string;
                        credits: number;
                    };
                    examPeriod: {
                        id: number;
                        status: string;
                        name: string;
                        semester: string;
                        schoolYear: string;
                        startDate: Date;
                        endDate: Date;
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
        })[];
    } & {
        id: number;
        email: string;
        departmentId: number;
        userId: number;
        fullName: string;
        phone: string | null;
        teacherCode: string;
        degree: string;
    }>;
    create(body: any): Promise<{
        user: {
            id: number;
            username: string;
            email: string;
            password: string;
            role: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
        department: {
            id: number;
            name: string;
            code: string;
        };
    } & {
        id: number;
        email: string;
        departmentId: number;
        userId: number;
        fullName: string;
        phone: string | null;
        teacherCode: string;
        degree: string;
    }>;
    update(id: number, body: any): Promise<{
        user: {
            id: number;
            username: string;
            email: string;
            password: string;
            role: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
        department: {
            id: number;
            name: string;
            code: string;
        };
    } & {
        id: number;
        email: string;
        departmentId: number;
        userId: number;
        fullName: string;
        phone: string | null;
        teacherCode: string;
        degree: string;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
