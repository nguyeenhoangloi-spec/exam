import { PrismaService } from '../prisma/prisma.service';
export declare class SubjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        department: {
            id: number;
            name: string;
            code: string;
        };
        _count: {
            studentSubjects: number;
            examSchedules: number;
            questions: number;
        };
    } & {
        id: number;
        departmentId: number;
        subjectCode: string;
        subjectName: string;
        credits: number;
    })[]>;
    findOne(id: number): Promise<{
        department: {
            id: number;
            name: string;
            code: string;
        };
    } & {
        id: number;
        departmentId: number;
        subjectCode: string;
        subjectName: string;
        credits: number;
    }>;
    findChapters(subjectId: number): Promise<{
        id: number;
        name: string;
        order: number;
    }[]>;
    create(data: {
        subjectCode: string;
        subjectName: string;
        credits: number;
        departmentId: number;
    }): Promise<{
        department: {
            id: number;
            name: string;
            code: string;
        };
    } & {
        id: number;
        departmentId: number;
        subjectCode: string;
        subjectName: string;
        credits: number;
    }>;
    update(id: number, data: {
        subjectCode?: string;
        subjectName?: string;
        credits?: number;
        departmentId?: number;
    }): Promise<{
        department: {
            id: number;
            name: string;
            code: string;
        };
    } & {
        id: number;
        departmentId: number;
        subjectCode: string;
        subjectName: string;
        credits: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        departmentId: number;
        subjectCode: string;
        subjectName: string;
        credits: number;
    }>;
}
