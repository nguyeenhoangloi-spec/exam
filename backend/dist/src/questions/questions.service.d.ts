import { PrismaService } from '../prisma/prisma.service';
type Actor = {
    id: number;
    role: string;
    username?: string;
};
export declare class QuestionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(actor: Actor, query?: {
        subjectId?: number;
        chapter?: number;
        difficulty?: string;
        status?: string;
        search?: string;
    }): Promise<({
        subject: {
            id: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
            departmentId: number;
        };
        createdBy: {
            id: number;
            username: string;
        };
        options: {
            id: number;
            questionId: number;
            optionLabel: string;
            optionContent: string;
            isCorrect: boolean;
        }[];
    } & {
        id: number;
        code: string | null;
        subjectId: number;
        chapter: number;
        content: string;
        questionType: string;
        difficulty: string;
        score: number;
        explanation: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: number;
        approvedById: number | null;
    })[]>;
    findOne(actor: Actor, id: number | string): Promise<{
        subject: {
            id: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
            departmentId: number;
        };
        createdBy: {
            id: number;
            username: string;
        };
        options: {
            id: number;
            questionId: number;
            optionLabel: string;
            optionContent: string;
            isCorrect: boolean;
        }[];
    } & {
        id: number;
        code: string | null;
        subjectId: number;
        chapter: number;
        content: string;
        questionType: string;
        difficulty: string;
        score: number;
        explanation: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: number;
        approvedById: number | null;
    }>;
    create(actor: Actor, data: any): Promise<{
        subject: {
            id: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
            departmentId: number;
        };
        options: {
            id: number;
            questionId: number;
            optionLabel: string;
            optionContent: string;
            isCorrect: boolean;
        }[];
    } & {
        id: number;
        code: string | null;
        subjectId: number;
        chapter: number;
        content: string;
        questionType: string;
        difficulty: string;
        score: number;
        explanation: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: number;
        approvedById: number | null;
    }>;
    update(actor: Actor, id: number | string, data: any): Promise<{
        subject: {
            id: number;
            subjectCode: string;
            subjectName: string;
            credits: number;
            departmentId: number;
        };
        options: {
            id: number;
            questionId: number;
            optionLabel: string;
            optionContent: string;
            isCorrect: boolean;
        }[];
    } & {
        id: number;
        code: string | null;
        subjectId: number;
        chapter: number;
        content: string;
        questionType: string;
        difficulty: string;
        score: number;
        explanation: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: number;
        approvedById: number | null;
    }>;
    approve(actor: Actor, id: number | string, status?: string): Promise<{
        id: number;
        code: string | null;
        subjectId: number;
        chapter: number;
        content: string;
        questionType: string;
        difficulty: string;
        score: number;
        explanation: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: number;
        approvedById: number | null;
    }>;
    remove(actor: Actor, id: number | string): Promise<{
        id: number;
        code: string | null;
        subjectId: number;
        chapter: number;
        content: string;
        questionType: string;
        difficulty: string;
        score: number;
        explanation: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: number;
        approvedById: number | null;
    }>;
    saveBatch(actor: Actor, data: {
        questions: any[];
    }): Promise<any[]>;
}
export {};
