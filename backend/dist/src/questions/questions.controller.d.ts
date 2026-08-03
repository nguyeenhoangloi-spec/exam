import { Response } from 'express';
import { AiQuestionsService } from './ai.service';
import { BulkActionDto, CreateQuestionDto, GenerateAiQuestionsDto, QuestionQueryDto, RejectQuestionDto, SaveAiQuestionsDto, UpdateQuestionDto } from './dto/question.dto';
import { QuestionsService } from './questions.service';
export declare class QuestionsController {
    private readonly questions;
    private readonly ai;
    constructor(questions: QuestionsService, ai: AiQuestionsService);
    findAll(req: any, query: QuestionQueryDto): Promise<({
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
    statistics(req: any): any;
    filterOptions(req: any): any;
    template(): any;
    export(req: any, query: QuestionQueryDto, res: Response): Promise<void>;
    bulk(req: any, body: BulkActionDto): any;
    preview(req: any, file: Express.Multer.File): any;
    confirm(req: any, file: Express.Multer.File, raw: any): any;
    generateAi(body: GenerateAiQuestionsDto): Promise<any>;
    saveAi(req: any, body: SaveAiQuestionsDto): any;
    create(req: any, body: CreateQuestionDto): Promise<{
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
    findOne(req: any, id: string): Promise<{
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
    update(req: any, id: string, body: UpdateQuestionDto): Promise<{
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
    duplicate(req: any, id: string): any;
    submit(req: any, id: string): any;
    approve(req: any, id: string): Promise<{
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
    reject(req: any, id: string, body: RejectQuestionDto): any;
    archive(req: any, id: string): any;
    restore(req: any, id: string): any;
    remove(req: any, id: string): Promise<{
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
}
