import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';

describe('AiService', () => {
  let service: AiService;
  let geminiProvider: jest.Mocked<GeminiProvider>;
  let deepseekProvider: jest.Mocked<DeepSeekProvider>;

  beforeEach(async () => {
    const mockGemini = {
      generateText: jest.fn(),
    };
    const mockDeepSeek = {
      generateText: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: GeminiProvider, useValue: mockGemini },
        { provide: DeepSeekProvider, useValue: mockDeepSeek },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    geminiProvider = module.get(GeminiProvider);
    deepseekProvider = module.get(DeepSeekProvider);
  });

  it('should use GeminiProvider when Gemini succeeds', async () => {
    geminiProvider.generateText.mockResolvedValue('Gemini response text');

    const result = await service.generateWithFallback('Hello prompt');

    expect(result.text).toBe('Gemini response text');
    expect(result.providerUsed).toBe('GEMINI');
    expect(geminiProvider.generateText).toHaveBeenCalledTimes(1);
    expect(deepseekProvider.generateText).not.toHaveBeenCalled();
  });

  it('should fallback to DeepSeekProvider when GeminiProvider fails', async () => {
    geminiProvider.generateText.mockRejectedValue(new Error('Gemini API 500 Server Error'));
    deepseekProvider.generateText.mockResolvedValue('DeepSeek fallback response');

    const result = await service.generateWithFallback('Hello prompt');

    expect(result.text).toBe('DeepSeek fallback response');
    expect(result.providerUsed).toBe('DEEPSEEK');
    expect(geminiProvider.generateText).toHaveBeenCalledTimes(1);
    expect(deepseekProvider.generateText).toHaveBeenCalledTimes(1);
  });

  it('should throw ServiceUnavailableException when both providers fail', async () => {
    geminiProvider.generateText.mockRejectedValue(new Error('Gemini Quota Exceeded'));
    deepseekProvider.generateText.mockRejectedValue(new Error('DeepSeek Network Timeout'));

    await expect(service.generateWithFallback('Hello prompt')).rejects.toThrow(
      ServiceUnavailableException,
    );

    expect(geminiProvider.generateText).toHaveBeenCalledTimes(1);
    expect(deepseekProvider.generateText).toHaveBeenCalledTimes(1);
  });
});
