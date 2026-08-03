import { PrismaService } from '../prisma/prisma.service';
export declare class DepartmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            classes: number;
            teachers: number;
            subjects: number;
        };
    } & {
        id: number;
        name: string;
        code: string;
    })[]>;
    findOne(id: number): Promise<{
        classes: {
            id: number;
            name: string;
            code: string;
            departmentId: number;
        }[];
        teachers: {
            id: number;
            email: string;
            departmentId: number;
            userId: number;
            fullName: string;
            phone: string | null;
            teacherCode: string;
            degree: string;
        }[];
        subjects: {
            id: number;
            departmentId: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
        }[];
    } & {
        id: number;
        name: string;
        code: string;
    }>;
    create(data: {
        code: string;
        name: string;
    }): Promise<{
        id: number;
        name: string;
        code: string;
    }>;
    update(id: number, data: {
        code?: string;
        name?: string;
    }): Promise<{
        id: number;
        name: string;
        code: string;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        code: string;
    }>;
}
