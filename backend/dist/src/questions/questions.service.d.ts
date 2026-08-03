import { PrismaService } from '../prisma/prisma.service';
export declare class QuestionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query?: {
        subjectId?: number;
        chapter?: number;
        difficulty?: string;
        status?: string;
    }): Promise<({
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
    create(userId: number, data: {
        subjectId: number;
        chapter: number;
        content: string;
        questionType?: string;
        difficulty?: string;
        score?: number;
        explanation?: string;
        options: {
            optionLabel: string;
            optionContent: string;
            isCorrect: boolean;
        }[];
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
    update(id: number, data: any): Promise<{
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
    approve(id: number, status?: string): Promise<{
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
