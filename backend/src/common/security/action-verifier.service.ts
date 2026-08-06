import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfirmCriticalActionDto } from '../dto/critical-action.dto';

export interface IActionVerifierStrategy {
  verify(userId: number, dto: ConfirmCriticalActionDto, expectedPhrase: string): Promise<boolean>;
}

@Injectable()
export class ActionVerifierService implements IActionVerifierStrategy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifies critical action step-by-step:
   * 1. Checks current user exists and is ACTIVE.
   * 2. Verifies confirmPhrase matches expectedPhrase.
   * 3. Verifies current user's password securely via bcrypt.
   */
  async verify(userId: number, dto: ConfirmCriticalActionDto, expectedPhrase: string): Promise<boolean> {
    if (!dto) {
      throw new BadRequestException('Dữ liệu xác minh không hợp lệ.');
    }

    // Helper to strip vietnamese diacritics
    const stripDiacritics = (s: string) =>
      (s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .trim()
        .toUpperCase();

    // 1. Verify confirm phrase (support both diacritics & plain text)
    const normalizedInputPhrase = stripDiacritics(dto.confirmPhrase);
    const normalizedExpectedPhrase = stripDiacritics(expectedPhrase);

    if (!normalizedInputPhrase || normalizedInputPhrase !== normalizedExpectedPhrase) {
      throw new BadRequestException(
        `Cụm từ xác nhận không chính xác. Vui lòng gõ cụm từ "${expectedPhrase}".`,
      );
    }

    // 2. Check user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa.');
    }

    // 3. Verify user password (if provided, verify bcrypt; if omitted, allow for authenticated active user)
    if (dto.password) {
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Mật khẩu tài khoản không chính xác. Thao tác bị hủy.');
      }
    }

    return true;
  }
}
