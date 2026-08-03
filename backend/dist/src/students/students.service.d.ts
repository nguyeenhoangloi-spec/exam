import { PrismaService } from '../prisma/prisma.service';
export declare class StudentsService {
    private prisma;
    constructor(prisma: PrismaService);
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
    create(data: {
        studentCode: string;
        fullName: string;
        gender: string;
        dateOfBirth: string;
        email: string;
        phone?: string;
        classId: number;
        username?: string;
        password?: string;
    }): Promise<{
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
    update(id: number, data: {
        fullName?: string;
        gender?: string;
        dateOfBirth?: string;
        email?: string;
        phone?: string;
        classId?: number;
    }): Promise<{
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
    getPersonalSchedule(userId: number): Promise<{
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
}
