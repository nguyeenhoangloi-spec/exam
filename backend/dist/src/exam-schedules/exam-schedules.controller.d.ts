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
        examPeriod: {
            id: number;
            status: string;
            name: string;
            semester: string;
            schoolYear: string;
            startDate: Date;
            endDate: Date;
        };
        examScheduleRooms: ({
            _count: {
                examRoomStudents: number;
                supervisors: number;
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
    })[]>;
    findOne(id: number): Promise<{
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
        examScheduleRooms: ({
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
        })[];
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
        subjectId: number;
        examDate: Date;
        startTime: string;
        endTime: string;
        examType: string;
        note: string | null;
        examPeriodId: number;
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
        subjectId: number;
        examDate: Date;
        startTime: string;
        endTime: string;
        examType: string;
        note: string | null;
        examPeriodId: number;
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
        subjectId: number;
        examDate: Date;
        startTime: string;
        endTime: string;
        examType: string;
        note: string | null;
        examPeriodId: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        status: string;
        subjectId: number;
        examDate: Date;
        startTime: string;
        endTime: string;
        examType: string;
        note: string | null;
        examPeriodId: number;
    }>;
}
