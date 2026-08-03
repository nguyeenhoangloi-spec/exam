import { PrismaService } from '../prisma/prisma.service';
export declare class ExamRoomsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: number;
        status: string;
        roomCode: string;
        roomName: string;
        building: string;
        capacity: number;
        roomType: string;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        status: string;
        roomCode: string;
        roomName: string;
        building: string;
        capacity: number;
        roomType: string;
    }>;
    create(data: {
        roomCode: string;
        roomName: string;
        building: string;
        capacity: number;
        roomType?: string;
        status?: string;
    }): Promise<{
        id: number;
        status: string;
        roomCode: string;
        roomName: string;
        building: string;
        capacity: number;
        roomType: string;
    }>;
    update(id: number, data: any): Promise<{
        id: number;
        status: string;
        roomCode: string;
        roomName: string;
        building: string;
        capacity: number;
        roomType: string;
    }>;
    remove(id: number): Promise<{
        id: number;
        status: string;
        roomCode: string;
        roomName: string;
        building: string;
        capacity: number;
        roomType: string;
    }>;
}
