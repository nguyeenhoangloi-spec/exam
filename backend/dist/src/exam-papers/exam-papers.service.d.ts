import { PrismaService } from '../prisma/prisma.service';
export declare class ExamPapersService {
    private prisma;
    constructor(prisma: PrismaService);
    createRandom(userId: number, data: {
        examScheduleId: number;
        paperCode: string;
        title?: string;
        durationMinutes: number;
        easyCount: number;
        mediumCount: number;
        hardCount: number;
    }): Promise<{
        questions: ({
            question: {
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
            };
        } & {
            id: number;
            score: number;
            questionId: number;
            questionOrder: number;
            examPaperId: number;
        })[];
        examSchedule: {
            subject: {
                id: number;
                departmentId: number;
                subjectCode: string;
                subjectName: string;
                credits: number;
            };
        } & {
            id: number;
            status: string;
            examDate: Date;
            startTime: string;
            endTime: string;
            examType: string;
            note: string | null;
            examPeriodId: number;
            subjectId: number;
        };
    } & {
        id: number;
        createdById: number;
        examScheduleId: number;
        paperCode: string;
        title: string;
        durationMinutes: number;
        totalScore: number;
    }>;
    findAll(examScheduleId?: number): Promise<({
        examSchedule: {
            subject: {
                id: number;
                departmentId: number;
                subjectCode: string;
                subjectName: string;
                credits: number;
            };
        } & {
            id: number;
            status: string;
            examDate: Date;
            startTime: string;
            endTime: string;
            examType: string;
            note: string | null;
            examPeriodId: number;
            subjectId: number;
        };
        createdBy: {
            id: number;
            username: string;
        };
        _count: {
            questions: number;
        };
    } & {
        id: number;
        createdById: number;
        examScheduleId: number;
        paperCode: string;
        title: string;
        durationMinutes: number;
        totalScore: number;
    })[]>;
    findOne(id: number): Promise<{
        questions: ({
            question: {
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
            };
        } & {
            id: number;
            score: number;
            questionId: number;
            questionOrder: number;
            examPaperId: number;
        })[];
        examSchedule: {
            subject: {
                id: number;
                departmentId: number;
                subjectCode: string;
                subjectName: string;
                credits: number;
            };
            examPeriod: {
                id: number;
                status: string;
                name: string;
                semester: string;
                schoolYear: string;
                startDate: Date;
                endDate: Date;
            };
        } & {
            id: number;
            status: string;
            examDate: Date;
            startTime: string;
            endTime: string;
            examType: string;
            note: string | null;
            examPeriodId: number;
            subjectId: number;
        };
        createdBy: {
            id: number;
            username: string;
        };
    } & {
        id: number;
        createdById: number;
        examScheduleId: number;
        paperCode: string;
        title: string;
        durationMinutes: number;
        totalScore: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdById: number;
        examScheduleId: number;
        paperCode: string;
        title: string;
        durationMinutes: number;
        totalScore: number;
    }>;
}
