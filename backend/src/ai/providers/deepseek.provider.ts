import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeepSeekProvider {
  private readonly logger = new Logger(DeepSeekProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async generateText(prompt: string, options?: { systemPrompt?: string; timeoutMs?: number; maxTokens?: number }): Promise<string> {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const baseUrl = (this.configService.get<string>('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com').replace(/\/$/, '');
    const modelName = this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat';
    const timeoutMs = options?.timeoutMs || 30000;

    const messages: Array<{ role: string; content: string }> = [];
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      this.logger.log(`Calling DeepSeek API (${baseUrl}/chat/completions, model: ${modelName})...`);
      
      const endpoint = baseUrl.endsWith('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          stream: false,
          temperature: 0.3,
          ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as any;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('DeepSeek API returned empty choices or response');
      }

      return content;
    } catch (error: any) {
      clearTimeout(timer);
      if (error?.name === 'AbortError') {
        this.logger.error(`DeepSeek API timed out after ${timeoutMs}ms`);
        throw new Error(`DeepSeek API timed out after ${timeoutMs}ms`);
      }
      this.logger.error(`DeepSeek API error: ${error?.message || error}`);
      throw error;
    }
  }
}
