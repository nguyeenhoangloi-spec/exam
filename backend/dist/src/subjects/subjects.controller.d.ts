import { SubjectsService } from './subjects.service';
export declare class SubjectsController {
    private readonly subjectsService;
    constructor(subjectsService: SubjectsService);
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
        questions: {
            id: number;
            status: string;
            subjectId: number;
            chapter: number;
            content: string;
            questionType: string;
            difficulty: string;
            score: number;
            explanation: string | null;
            createdById: number;
        }[];
    } & {
        id: number;
        departmentId: number;
        subjectCode: string;
        subjectName: string;
        credits: number;
    }>;
    create(body: {
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
    update(id: number, body: any): Promise<{
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
