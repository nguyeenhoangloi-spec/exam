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
                userId: number;
                fullName: string;
                phone: string | null;
                studentCode: string;
                gender: string;
                dateOfBirth: Date;
                classId: number;
            };
            teacher: {
                id: number;
                email: string;
                departmentId: number;
                teacherCode: string;
                userId: number;
                fullName: string;
                degree: string;
                phone: string | null;
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
            userId: number;
            fullName: string;
            phone: string | null;
            studentCode: string;
            gender: string;
            dateOfBirth: Date;
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
            teacherCode: string;
            userId: number;
            fullName: string;
            degree: string;
            phone: string | null;
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
