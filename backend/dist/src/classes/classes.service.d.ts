import { PrismaService } from '../prisma/prisma.service';
export declare class ClassesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        department: {
            id: number;
            name: string;
            code: string;
        };
        _count: {
            students: number;
        };
    } & {
        id: number;
        name: string;
        code: string;
        departmentId: number;
    })[]>;
    findOne(id: number): Promise<{
        department: {
            id: number;
            name: string;
            code: string;
        };
        students: {
            id: number;
            email: string;
            studentCode: string;
            userId: number;
            fullName: string;
            gender: string;
            dateOfBirth: Date;
            phone: string | null;
            classId: number;
        }[];
    } & {
        id: number;
        name: string;
        code: string;
        departmentId: number;
    }>;
    create(data: {
        code: string;
        name: string;
        departmentId: number;
    }): Promise<{
        id: number;
        name: string;
        code: string;
        departmentId: number;
    }>;
    update(id: number, data: {
        code?: string;
        name?: string;
        departmentId?: number;
    }): Promise<{
        id: number;
        name: string;
        code: string;
        departmentId: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        code: string;
        departmentId: number;
    }>;
}
