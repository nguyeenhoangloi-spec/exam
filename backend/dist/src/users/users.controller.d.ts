import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getDashboardStats(): Promise<{
        totalStudents: number;
        totalTeachers: number;
        totalSubjects: number;
        totalExamSchedules: number;
        totalExamRooms: number;
        pendingQuestions: number;
    }>;
    findAll(): Promise<{
        id: number;
        username: string;
        email: string;
        role: string;
        status: string;
        createdAt: Date;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        username: string;
        email: string;
        role: string;
        status: string;
        createdAt: Date;
        student: {
            id: number;
            email: string;
            studentCode: string;
            userId: number;
            fullName: string;
            gender: string;
            dateOfBirth: Date;
            phone: string | null;
            classId: number;
        };
        teacher: {
            id: number;
            email: string;
            departmentId: number;
            userId: number;
            fullName: string;
            phone: string | null;
            teacherCode: string;
            degree: string;
        };
    }>;
}
