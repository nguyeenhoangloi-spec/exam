import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
        totalStudents: number;
        totalTeachers: number;
        totalSubjects: number;
        totalExamSchedules: number;
        totalExamRooms: number;
        pendingQuestions: number;
    }>;
    findAll(): Promise<{
        id: number;
        username: string;
        email: string;
        role: string;
        status: string;
        createdAt: Date;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        username: string;
        email: string;
        role: string;
        status: string;
        createdAt: Date;
        student: {
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
    }>;
}
