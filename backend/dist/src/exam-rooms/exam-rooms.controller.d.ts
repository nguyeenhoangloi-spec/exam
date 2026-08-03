import { ExamRoomsService } from './exam-rooms.service';
export declare class ExamRoomsController {
    private readonly examRoomsService;
    constructor(examRoomsService: ExamRoomsService);
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
    create(body: any): Promise<{
        id: number;
        status: string;
        roomCode: string;
        roomName: string;
        building: string;
        capacity: number;
        roomType: string;
    }>;
    update(id: number, body: any): Promise<{
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
