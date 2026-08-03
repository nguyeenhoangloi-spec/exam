import { ClassesService } from './classes.service';
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
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
    create(body: {
        code: string;
        name: string;
        departmentId: number;
    }): Promise<{
        id: number;
        name: string;
        code: string;
        departmentId: number;
    }>;
    update(id: number, body: {
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
