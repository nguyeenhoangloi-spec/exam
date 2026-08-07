import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async generateText(prompt: string, options?: { systemPrompt?: string; timeoutMs?: number }): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-1.5-flash';
    const candidateModels = Array.from(new Set([modelName, 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-exp']));
    const timeoutMs = options?.timeoutMs || Number(this.configService.get<number>('GEMINI_TIMEOUT_MS')) || 30000;

    const genAI = new GoogleGenerativeAI(apiKey);

    let lastError: any = null;
    for (const curModel of candidateModels) {
      const model = genAI.getGenerativeModel({
        model: curModel,
        systemInstruction: options?.systemPrompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Gemini API timed out after ${timeoutMs}ms`)), timeoutMs);
      });

      try {
        this.logger.log(`Calling Gemini API (model: ${curModel})...`);
        const apiPromise = model.generateContent(prompt);
        const result = await Promise.race([apiPromise, timeoutPromise]);
        const response = await result.response;
        const text = response.text();
        if (text) return text;
      } catch (error: any) {
        lastError = error;
        const msg = String(error?.message || error);
        if (!msg.includes('404') && !msg.includes('not found')) {
          throw error;
        }
      }
    }
    throw lastError || new Error('Gemini API failed on all candidate models');
  }
}
