import { ExamPeriodsService } from './exam-periods.service';
export declare class ExamPeriodsController {
    private readonly examPeriodsService;
    constructor(examPeriodsService: ExamPeriodsService);
    findAll(): Promise<({
        _count: {
            examSchedules: number;
        };
    } & {
        id: number;
        status: string;
        name: string;
        semester: string;
        schoolYear: string;
        startDate: Date;
        endDate: Date;
    })[]>;
    findOne(id: number): Promise<{
        examSchedules: ({
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
            subjectId: number;
            examDate: Date;
            startTime: string;
            endTime: string;
            examType: string;
            note: string | null;
            examPeriodId: number;
        })[];
    } & {
        id: number;
        status: string;
        name: string;
        semester: string;
        schoolYear: string;
        startDate: Date;
        endDate: Date;
    }>;
    create(body: any): Promise<{
        id: number;
        status: string;
        name: string;
        semester: string;
        schoolYear: string;
        startDate: Date;
        endDate: Date;
    }>;
    update(id: number, body: any): Promise<{
        id: number;
        status: string;
        name: string;
        semester: string;
        schoolYear: string;
        startDate: Date;
        endDate: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        status: string;
        name: string;
        semester: string;
        schoolYear: string;
        startDate: Date;
        endDate: Date;
    }>;
}
