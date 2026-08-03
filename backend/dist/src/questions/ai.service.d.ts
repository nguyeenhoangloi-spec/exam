import { PrismaService } from '../prisma/prisma.service';
import { GenerateAiQuestionsDto } from './dto/question.dto';
export declare class AiQuestionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generate(input: GenerateAiQuestionsDto): Promise<any>;
}
