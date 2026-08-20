import { ServiceUnavailableException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService Google OAuth resilience', () => {
  const originalFetch = global.fetch;
  const originalTimeout = process.env.GOOGLE_OAUTH_TIMEOUT_MS;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalTimeout === undefined) {
      delete process.env.GOOGLE_OAUTH_TIMEOUT_MS;
    } else {
      process.env.GOOGLE_OAUTH_TIMEOUT_MS = originalTimeout;
    }
    jest.useRealTimers();
  });

  it('stops waiting when Google does not respond before the configured timeout', async () => {
    jest.useFakeTimers();
    process.env.GOOGLE_OAUTH_TIMEOUT_MS = '1000';
    global.fetch = jest.fn((_url: string, options?: RequestInit) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      });
    })) as typeof fetch;
    const service = new AuthService({} as any, {} as any, {} as any, {} as any);

    const pending = (service as any).fetchGoogle('https://google.test', {}, 'xác thực tài khoản');
    const expectation = expect(pending).rejects.toBeInstanceOf(ServiceUnavailableException);
    await jest.advanceTimersByTimeAsync(1000);

    await expectation;
  });
});
