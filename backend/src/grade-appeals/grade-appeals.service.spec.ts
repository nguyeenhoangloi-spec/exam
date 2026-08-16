import { NotFoundException } from '@nestjs/common';
import { GradeAppealsService } from './grade-appeals.service';

describe('GradeAppealsService permissions', () => {
  const prisma = {
    gradeAppeal: {
      findFirst: jest.fn(),
    },
  };
  const audit = { write: jest.fn() };
  const service = new GradeAppealsService(prisma as any, audit as any);

  beforeEach(() => jest.clearAllMocks());

  it('chỉ trả về đơn phúc khảo thuộc sinh viên đang đăng nhập', async () => {
    const appeal = { id: 'appeal-1', studentId: 12 };
    prisma.gradeAppeal.findFirst.mockResolvedValue(appeal);

    await expect(service.findOne({ id: 42, role: 'STUDENT' }, 'appeal-1')).resolves.toBe(appeal);
    expect(prisma.gradeAppeal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'appeal-1',
          student: { userId: 42 },
        },
      }),
    );
  });

  it('không tiết lộ đơn phúc khảo của tài khoản khác', async () => {
    prisma.gradeAppeal.findFirst.mockResolvedValue(null);

    await expect(service.findOne({ id: 42, role: 'STUDENT' }, 'appeal-of-another-student')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cho phép Admin/Giảng viên mở chi tiết đơn để thẩm định', async () => {
    const appeal = { id: 'appeal-2', studentId: 99 };
    prisma.gradeAppeal.findFirst.mockResolvedValue(appeal);

    await expect(service.findOne({ id: 7, role: 'TEACHER' }, 'appeal-2')).resolves.toBe(appeal);
    expect(prisma.gradeAppeal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'appeal-2' } }),
    );
  });
});
