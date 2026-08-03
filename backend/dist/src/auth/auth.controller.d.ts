import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
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
            id: number;
            username: string;
            email: string;
            role: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getProfile(req: any): Promise<{
        student: {
            class: {
                id: number;
                name: string;
                code: string;
                departmentId: number;
            };
        } & {
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
            department: {
                id: number;
                name: string;
                code: string;
            };
        } & {
            id: number;
            email: string;
            departmentId: number;
            userId: number;
            fullName: string;
            phone: string | null;
            teacherCode: string;
            degree: string;
        };
        id: number;
        username: string;
        email: string;
        role: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
