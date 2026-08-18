import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy session enforcement', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-jwt-secret';
  });

  it('rejects legacy or forged access tokens without a server-side session id', async () => {
    const prisma = { authSession: { findFirst: jest.fn() } };
    const strategy = new JwtStrategy(prisma as any);

    await expect(strategy.validate({ sub: 1, username: 'student', role: 'STUDENT' }))
      .rejects
      .toBeInstanceOf(UnauthorizedException);
    expect(prisma.authSession.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a revoked, expired or missing server-side session', async () => {
    const prisma = { authSession: { findFirst: jest.fn().mockResolvedValue(null) } };
    const strategy = new JwtStrategy(prisma as any);

    await expect(strategy.validate({ sub: 1, username: 'student', role: 'STUDENT', sid: 'session-1' }))
      .rejects
      .toBeInstanceOf(UnauthorizedException);
  });

  it('returns the current database role and strips the password for an active session', async () => {
    const prisma = {
      authSession: {
        findFirst: jest.fn().mockResolvedValue({
          user: {
            id: 1,
            username: 'teacher',
            role: 'TEACHER',
            status: 'ACTIVE',
            password: 'secret-hash',
            student: null,
            teacher: { id: 9 },
          },
        }),
      },
    };
    const strategy = new JwtStrategy(prisma as any);

    const user = await strategy.validate({ sub: 1, username: 'old-name', role: 'STUDENT', sid: 'session-1' });

    expect(user).toMatchObject({ id: 1, username: 'teacher', role: 'TEACHER' });
    expect(user).not.toHaveProperty('password');
  });
});
