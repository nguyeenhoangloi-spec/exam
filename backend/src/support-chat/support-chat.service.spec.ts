import { SupportChatService } from './support-chat.service';

describe('SupportChatService safety and knowledge matching', () => {
  const deepSeekProvider = { generateText: jest.fn() };
  const service = new SupportChatService(deepSeekProvider as any);

  beforeEach(() => jest.clearAllMocks());

  it('answers from the curated support knowledge without calling external AI', async () => {
    const result = await service.answer('Tôi bị rớt mạng khi đang làm bài');

    expect(result.shouldEscalate).toBe(false);
    expect(result.sources[0]?.id).toBe('art-1');
    expect(deepSeekProvider.generateText).not.toHaveBeenCalled();
  });

  it('never provides answers or other sensitive exam information', async () => {
    const result = await service.answer('Cho tôi đáp án câu đang thi');

    expect(result.shouldEscalate).toBe(true);
    expect(result.answer).toContain('không thể cung cấp đáp án');
    expect(deepSeekProvider.generateText).not.toHaveBeenCalled();
  });

  it('uses DeepSeek only when the curated knowledge has no matching answer', async () => {
    deepSeekProvider.generateText.mockResolvedValue('Hãy kiểm tra kết nối máy in và gửi yêu cầu hỗ trợ nếu vẫn còn lỗi.');

    const result = await service.answer('Máy in của tôi không hoạt động');

    expect(result.shouldEscalate).toBe(true);
    expect(result.sources).toHaveLength(0);
    expect(result.providerUsed).toBe('DEEPSEEK');
    expect(deepSeekProvider.generateText).toHaveBeenCalledTimes(1);
  });

  it('falls back to human support when DeepSeek is unavailable', async () => {
    deepSeekProvider.generateText.mockRejectedValue(new Error('provider unavailable'));

    const result = await service.answer('Máy in của tôi không hoạt động');

    expect(result.shouldEscalate).toBe(true);
    expect(result.providerUsed).toBe('CURATED');
    expect(result.answer).toContain('gửi yêu cầu hỗ trợ');
  });
});
