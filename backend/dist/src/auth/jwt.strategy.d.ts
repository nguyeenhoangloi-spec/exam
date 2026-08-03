import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: {
        sub: number;
        username: string;
        role: string;
    }): Promise<{
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
    }>;
}
export {};
