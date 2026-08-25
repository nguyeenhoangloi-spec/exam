import { ForbiddenException } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { SecurityAuditInterceptor } from './security-audit.interceptor';

describe('SecurityAuditInterceptor', () => {
  const options = {
    category: 'DATA_ACCESS' as const,
    action: 'EXAM_PAPER_ANSWER_KEY_VIEWED',
    entityType: 'EXAM_PAPER',
    entityIdParam: 'id',
  };

  const context = (user = { id: 12, role: 'TEACHER' }) => ({
    getHandler: () => 'handler',
    getClass: () => 'controller',
    switchToHttp: () => ({ getRequest: () => ({ user, params: { id: '169' } }) }),
  }) as any;

  it('ghi nhận truy cập nhạy cảm sau khi handler trả dữ liệu thành công', async () => {
    const reflector = { getAllAndOverride: jest.fn(() => options) } as any;
    const securityAudit = { write: jest.fn().mockResolvedValue({ id: 'event' }) } as any;
    const interceptor = new SecurityAuditInterceptor(reflector, securityAudit);

    await lastValueFrom(interceptor.intercept(context(), { handle: () => of({ paperCode: 'DT-001' }) } as any));

    expect(securityAudit.write).toHaveBeenCalledWith(expect.objectContaining({
      category: 'DATA_ACCESS', action: 'EXAM_PAPER_ANSWER_KEY_VIEWED', outcome: 'SUCCESS',
      entityType: 'EXAM_PAPER', entityId: '169', actor: expect.objectContaining({ id: 12 }),
    }));
  });

  it('ghi nhận bị từ chối khi handler chặn truy cập dữ liệu nhạy cảm', async () => {
    const reflector = { getAllAndOverride: jest.fn(() => options) } as any;
    const securityAudit = { write: jest.fn().mockResolvedValue({ id: 'event' }) } as any;
    const interceptor = new SecurityAuditInterceptor(reflector, securityAudit);

    await expect(lastValueFrom(interceptor.intercept(context(), { handle: () => throwError(() => new ForbiddenException()) } as any))).rejects.toThrow(ForbiddenException);

    expect(securityAudit.write).toHaveBeenCalledWith(expect.objectContaining({
      action: 'EXAM_PAPER_ANSWER_KEY_VIEWED', outcome: 'DENIED', metadata: { status: 403 },
    }));
  });
});
