import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa.');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    if (user.role === 'ADMIN') {
      await this.audit.write({
        actorId: user.id,
        action: 'LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        description: 'Đã đăng nhập trang quản trị',
      });
    }

    const { password, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: { class: true },
        },
        teacher: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng.');
    }

    const { password, ...result } = user;
    return result;
  }
}
