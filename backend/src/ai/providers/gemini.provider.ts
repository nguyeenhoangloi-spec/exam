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
    const timeoutMs = options?.timeoutMs || Number(this.configService.get<number>('GEMINI_TIMEOUT_MS')) || 30000;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: options?.systemPrompt,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Gemini API timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      this.logger.log(`Calling Gemini API (model: ${modelName})...`);
      const apiPromise = model.generateContent(prompt);
      const result = await Promise.race([apiPromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text();
      if (!text) {
        throw new Error('Gemini API returned empty response');
      }
      return text;
    } catch (error: any) {
      this.logger.error(`Gemini API error: ${error?.message || error}`);
      throw error;
    }
  }
}
