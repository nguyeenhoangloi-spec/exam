import { QuestionsService } from './questions.service';
import { AiQuestionsService } from './ai.service';
export declare class QuestionsController {
    private readonly questionsService;
    private readonly ai;
    constructor(questionsService: QuestionsService, ai: AiQuestionsService);
    import(req: any, file: any): Promise<{
        imported: number;
        errors: any[];
    }>;
    generate(body: any): Promise<any>;
    extractDocument(file: any): Promise<{
        text: any;
        fileName: any;
    }>;
    findAll(subjectId?: string, chapter?: string, difficulty?: string, status?: string): Promise<({
        subject: {
            id: number;
            departmentId: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
        };
        createdBy: {
            id: number;
            username: string;
            role: string;
        };
        options: {
            id: number;
            optionLabel: string;
            optionContent: string;
            isCorrect: boolean;
            questionId: number;
        }[];
    } & {
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
    })[]>;
    findOne(id: number): Promise<{
        subject: {
            id: number;
            departmentId: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
        };
        createdBy: {
            id: number;
            username: string;
            role: string;
        };
        options: {
            id: number;
            optionLabel: string;
            optionContent: string;
            isCorrect: boolean;
            questionId: number;
        }[];
    } & {
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
    }>;
    create(req: any, body: any): Promise<{
        subject: {
            id: number;
            departmentId: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
        };
        options: {
            id: number;
            optionLabel: string;
            optionContent: string;
            isCorrect: boolean;
            questionId: number;
        }[];
    } & {
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
    }>;
    update(id: number, body: any): Promise<{
        subject: {
            id: number;
            departmentId: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
        };
        options: {
            id: number;
            optionLabel: string;
            optionContent: string;
            isCorrect: boolean;
            questionId: number;
        }[];
    } & {
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
    }>;
    approve(id: number, body: {
        status?: string;
    }): Promise<{
        subject: {
            id: number;
            departmentId: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
        };
        options: {
            id: number;
            optionLabel: string;
            optionContent: string;
            isCorrect: boolean;
            questionId: number;
        }[];
    } & {
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
    }>;
    remove(id: number): Promise<{
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
    }>;
}
