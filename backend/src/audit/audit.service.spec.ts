import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('ghi đúng actor, thực thể và metadata', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'audit-1' });
    const service = new AuditService({ auditLog: { create } } as any);

    await service.write({
      actorId: 1,
      action: 'APPROVE',
      entityType: 'QUESTION',
      entityId: 'question-1',
      description: 'Đã duyệt câu hỏi Q000001',
      metadata: { questionCode: 'Q000001' },
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        actorId: 1,
        action: 'APPROVE',
        entityType: 'QUESTION',
        entityId: 'question-1',
        description: 'Đã duyệt câu hỏi Q000001',
        metadata: { questionCode: 'Q000001' },
      },
    });
  });
});
