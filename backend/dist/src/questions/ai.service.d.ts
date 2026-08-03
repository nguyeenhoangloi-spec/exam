export declare class AiQuestionsService {
    extractDocument(file: any): Promise<any>;
    generate(input: {
        subject: string;
        chapter: number;
        count: number;
        difficulty: string;
        prompt: string;
    }): Promise<any>;
    private generateLocalFallbackQuestions;
}
