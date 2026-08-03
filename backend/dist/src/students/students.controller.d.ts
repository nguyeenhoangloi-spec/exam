import { StudentsService } from './students.service';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    getMySchedule(req: any): Promise<{
        id: number;
        examNumber: string;
        seatNumber: number;
        status: string;
        subjectCode: string;
        subjectName: string;
        credits: number;
        examDate: Date;
        startTime: string;
        endTime: string;
        examType: string;
        roomCode: string;
        roomName: string;
        building: string;
        periodName: string;
    }[]>;
    findAll(search?: string): Promise<({
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
        class: {
            department: {
                id: number;
                name: string;
                code: string;
            };
        } & {
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
        class: {
            department: {
                id: number;
                name: string;
                code: string;
            };
        } & {
            id: number;
            name: string;
            code: string;
            departmentId: number;
        };
        studentSubjects: ({
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
            semester: string;
            schoolYear: string;
            studentId: number;
            subjectId: number;
        })[];
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
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
