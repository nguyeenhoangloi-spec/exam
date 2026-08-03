import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
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
            teacherCode: string;
            userId: number;
            fullName: string;
            degree: string;
            phone: string | null;
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
    create(body: {
        code: string;
        name: string;
    }): Promise<{
        id: number;
        name: string;
        code: string;
    }>;
    update(id: number, body: {
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
