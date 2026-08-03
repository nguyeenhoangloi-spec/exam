import { ExamSchedulesService } from './exam-schedules.service';
export declare class ExamSchedulesController {
    private readonly examSchedulesService;
    constructor(examSchedulesService: ExamSchedulesService);
    findAll(examPeriodId?: string): Promise<({
        subject: {
            id: number;
            departmentId: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
        };
        examScheduleRooms: ({
            _count: {
                supervisors: number;
                examRoomStudents: number;
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
        })[];
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
        examDate: Date;
        startTime: string;
        endTime: string;
        examType: string;
        note: string | null;
        examPeriodId: number;
        subjectId: number;
    })[]>;
    findOne(id: number): Promise<{
        subject: {
            id: number;
            departmentId: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
        };
        examScheduleRooms: ({
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
        })[];
        examPeriod: {
            id: number;
            status: string;
            name: string;
            semester: string;
            schoolYear: string;
            startDate: Date;
            endDate: Date;
        };
        examPapers: {
            id: number;
            createdById: number;
            examScheduleId: number;
            paperCode: string;
            title: string;
            durationMinutes: number;
            totalScore: number;
        }[];
    } & {
        id: number;
        status: string;
        examDate: Date;
        startTime: string;
        endTime: string;
        examType: string;
        note: string | null;
        examPeriodId: number;
        subjectId: number;
    }>;
    create(body: any): Promise<{
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
        examDate: Date;
        startTime: string;
        endTime: string;
        examType: string;
        note: string | null;
        examPeriodId: number;
        subjectId: number;
    }>;
    update(id: number, body: any): Promise<{
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
        examDate: Date;
        startTime: string;
        endTime: string;
        examType: string;
        note: string | null;
        examPeriodId: number;
        subjectId: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        status: string;
        examDate: Date;
        startTime: string;
        endTime: string;
        examType: string;
        note: string | null;
        examPeriodId: number;
        subjectId: number;
    }>;
}
