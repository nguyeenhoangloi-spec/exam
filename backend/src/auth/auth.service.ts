import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
  ) {}

  private readonly refreshTokenDays = Math.max(1, Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 30));

  private safeUser(user: any) {
    const { password, ...result } = user;
    return result;
  }

  private signAccessToken(user: { id: number; username: string; role: string }) {
    return this.jwtService.sign(
      { sub: user.id, username: user.username, role: user.role },
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    );
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createSession(user: any) {
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + this.refreshTokenDays * 24 * 60 * 60 * 1000);

    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken: this.signAccessToken(user),
      refreshToken,
      user: this.safeUser(user),
    };
  }

  async login(loginDto: LoginDto) {
    let user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { teacher: { teacherCode: loginDto.username } },
            { student: { studentCode: loginDto.username } },
          ],
        },
        include: {
          student: true,
          teacher: true,
        },
      });
    }

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

    if (user.role === 'ADMIN') {
      await this.audit.write({
        actorId: user.id,
        action: 'LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        description: 'Đã đăng nhập trang quản trị',
      });
    }

    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn.');

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: this.hashRefreshToken(refreshToken) },
      include: { user: { include: { student: true, teacher: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn.');
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.createSession(session.user);
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.authSession.updateMany({
        where: { tokenHash: this.hashRefreshToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async revokeAllSessions(userId: number) {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: { class: { include: { department: true } } },
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

  async changePassword(userId: number, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không trùng khớp.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại.');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.revokeAllSessions(userId);

    return { message: 'Đổi mật khẩu thành công.' };

  }

  async updateProfile(userId: number, dto: { fullName?: string; email?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true, student: true },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại.');

    try {
      // Update User email (if changed)
      if (dto.email && dto.email !== user.email) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { email: dto.email },
        });
      }

      // Update Teacher or Student fullName & phone
      if (user.teacher && (dto.fullName || dto.phone || dto.email)) {
        await this.prisma.teacher.update({
          where: { id: user.teacher.id },
          data: {
            ...(dto.fullName ? { fullName: dto.fullName } : {}),
            ...(dto.phone ? { phone: dto.phone } : {}),
            ...(dto.email && dto.email !== user.teacher.email ? { email: dto.email } : {}),
          },
        });
      } else if (user.student && (dto.fullName || dto.phone || dto.email)) {
        await this.prisma.student.update({
          where: { id: user.student.id },
          data: {
            ...(dto.fullName ? { fullName: dto.fullName } : {}),
            ...(dto.phone ? { phone: dto.phone } : {}),
            ...(dto.email && dto.email !== user.student.email ? { email: dto.email } : {}),
          },
        });
      } else if (dto.fullName && !user.teacher && !user.student) {
        // ADMIN accounts have no teacher/student record — keep the display name
        // synced via the User table is not possible (no column), so we store it
        // in a lightweight way: nothing to persist server-side for admin beyond email.
        // The frontend already persists admin display name in localStorage.
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Email đã được sử dụng bởi tài khoản khác.');
      }
      throw err;
    }

    return this.getProfile(userId);
  }

  private getGoogleConfig() {
    let clientId = process.env.GOOGLE_CLIENT_ID || '';
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    let redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback';

    try {
      const fs = require('node:fs');
      const path = require('node:path');
      const candidatePaths = [
        path.join(process.cwd(), 'backend', '.env'),
        path.join(process.cwd(), '.env'),
      ];
      for (const envPath of candidatePaths) {
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('GOOGLE_CLIENT_ID=')) {
              const val = trimmed.replace('GOOGLE_CLIENT_ID=', '').replace(/^["']|["']$/g, '').trim();
              if (val) clientId = val;
            } else if (trimmed.startsWith('GOOGLE_CLIENT_SECRET=')) {
              const val = trimmed.replace('GOOGLE_CLIENT_SECRET=', '').replace(/^["']|["']$/g, '').trim();
              if (val) clientSecret = val;
            } else if (trimmed.startsWith('GOOGLE_REDIRECT_URI=')) {
              const val = trimmed.replace('GOOGLE_REDIRECT_URI=', '').replace(/^["']|["']$/g, '').trim();
              if (val) redirectUri = val;
            }
          }
        }
      }
    } catch {}

    return { clientId, clientSecret, redirectUri };
  }

  /**
   * Generates Google OAuth redirect URL
   */
  getGoogleAuthUrl(): string {
    const { clientId, redirectUri } = this.getGoogleConfig();
    if (!clientId) {
      throw new BadRequestException(
        'Tính năng Đăng nhập Google chưa được kích hoạt: Chưa cấu hình GOOGLE_CLIENT_ID trong backend/.env.',
      );
    }
    const scope = encodeURIComponent('email profile');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&prompt=select_account`;
  }

  /**
   * Validates a Google account email against system database users.
   * Requirement: ONLY emails registered in the database can log in!
   */
  async validateGoogleEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Không nhận được thông tin email từ Google.');
    }

    const cleanEmail = email.toLowerCase().trim();

    // Search user by email (case-insensitive)
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
          mode: 'insensitive',
        },
      },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        `Email ${cleanEmail} chưa được đăng ký trong hệ thống. Vui lòng liên hệ Quản trị viên.`
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa.');
    }

    if (user.role === 'ADMIN') {
      await this.audit.write({
        actorId: user.id,
        action: 'LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        description: 'Đã đăng nhập bằng Google (Quản trị viên)',
      });
    }

    return this.createSession(user);
  }

  /**
   * Handles Google OAuth Callback code exchange
   */
  async handleGoogleCallback(code: string) {
    if (!code) {
      throw new BadRequestException('Mã xác thực Google không hợp lệ.');
    }

    const { clientId, clientSecret, redirectUri } = this.getGoogleConfig();
    if (!clientId || !clientSecret) {
      throw new BadRequestException('Chưa cấu hình GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trong backend/.env.');
    }

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) {
        const errorData = (await tokenRes.json().catch(() => ({}))) as any;
        throw new BadRequestException(`Xác thực Google thất bại: ${errorData.error_description || tokenRes.statusText}`);
      }

      const tokenData = (await tokenRes.json()) as any;
      const accessToken = tokenData.access_token;

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userRes.ok) {
        throw new BadRequestException('Không lấy được thông tin tài khoản Google.');
      }

      const googleUser = (await userRes.json()) as any;
      return this.validateGoogleEmail(googleUser.email);
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(`Lỗi đăng nhập Google: ${err.message || 'Không xác định'}`);
    }
  }

  /**
   * Validates Google ID token sent directly from frontend
   */
  async loginWithGoogleToken(idToken: string) {
    if (!idToken) {
      throw new BadRequestException('Thiếu Google ID Token.');
    }

    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!res.ok) {
        throw new BadRequestException('Google ID Token không hợp lệ hoặc đã hết hạn.');
      }
      const data = (await res.json()) as any;
      if (!data.email) {
        throw new BadRequestException('Không tìm thấy thông tin email từ Google ID Token.');
      }
      return this.validateGoogleEmail(data.email);
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(`Lỗi xác thực Google ID Token: ${err.message || 'Không xác định'}`);
    }
  }
}
