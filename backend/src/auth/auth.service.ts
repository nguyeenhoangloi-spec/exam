import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { ContactService } from '../contact/contact.service';
import { Logger } from '@nestjs/common';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpStore = new Map<string, {
    sessionId: string;
    code: string;
    userId: number;
    email: string;
    expiresAt: number;
    attempts: number;
  }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private audit: AuditService,
    private contactService: ContactService,
  ) {}

  private readonly refreshTokenDays = Math.max(1, Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 30));

  private safeUser(user: any) {
    const { password, ...result } = user;
    return result;
  }

  private signAccessToken(user: { id: number; username: string; role: string }, sessionId: string) {
    return this.jwtService.sign(
      { sub: user.id, username: user.username, role: user.role, sid: sessionId },
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    );
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createSession(user: any) {
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + this.refreshTokenDays * 24 * 60 * 60 * 1000);

    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken: this.signAccessToken(user, session.id),
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

    const rotation = await this.prisma.authSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (rotation.count !== 1) {
      throw new UnauthorizedException('Phiên đăng nhập đã được thay thế. Vui lòng đăng nhập lại.');
    }

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

  private async fetchGoogle(url: string, options: RequestInit, operation: string) {
    const configuredTimeout = Number(process.env.GOOGLE_OAUTH_TIMEOUT_MS || 10_000);
    const timeoutMs = Number.isFinite(configuredTimeout)
      ? Math.min(Math.max(configuredTimeout, 1_000), 30_000)
      : 10_000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new ServiceUnavailableException(`Google phản hồi quá chậm khi ${operation}. Vui lòng thử lại.`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Generates Google OAuth redirect URL
   */
  getGoogleAuthUrl(state?: string): string {
    const { clientId, redirectUri } = this.getGoogleConfig();
    if (!clientId) {
      throw new BadRequestException(
        'Tính năng Đăng nhập Google chưa được kích hoạt: Chưa cấu hình GOOGLE_CLIENT_ID trong backend/.env.',
      );
    }
    const scope = encodeURIComponent('email profile');
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&prompt=select_account${stateParam}`;
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
      const tokenRes = await this.fetchGoogle('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      }, 'xác thực tài khoản');

      if (!tokenRes.ok) {
        const errorData = (await tokenRes.json().catch(() => ({}))) as any;
        throw new BadRequestException(`Xác thực Google thất bại: ${errorData.error_description || tokenRes.statusText}`);
      }

      const tokenData = (await tokenRes.json()) as any;
      const accessToken = tokenData.access_token;

      const userRes = await this.fetchGoogle('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }, 'lấy thông tin tài khoản');

      if (!userRes.ok) {
        throw new BadRequestException('Không lấy được thông tin tài khoản Google.');
      }

      const googleUser = (await userRes.json()) as any;
      return this.validateGoogleEmail(googleUser.email);
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException || err instanceof ServiceUnavailableException) {
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
      const res = await this.fetchGoogle(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, {}, 'xác thực phiên Google');
      if (!res.ok) {
        throw new BadRequestException('Google ID Token không hợp lệ hoặc đã hết hạn.');
      }
      const data = (await res.json()) as any;
      if (!data.email) {
        throw new BadRequestException('Không tìm thấy thông tin email từ Google ID Token.');
      }
      const { clientId } = this.getGoogleConfig();
      if (!clientId || data.aud !== clientId || String(data.email_verified) !== 'true') {
        throw new UnauthorizedException('Google ID Token không được cấp cho ứng dụng này.');
      }
      return this.validateGoogleEmail(data.email);
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException || err instanceof ServiceUnavailableException) {
        throw err;
      }
      throw new BadRequestException(`Lỗi xác thực Google ID Token: ${err.message || 'Không xác định'}`);
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const rawIdentifier = dto.identifier.trim();
    if (!rawIdentifier) {
      throw new BadRequestException('Vui lòng nhập thông tin tài khoản hoặc email.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: rawIdentifier, mode: 'insensitive' } },
          { username: { equals: rawIdentifier, mode: 'insensitive' } },
          { student: { studentCode: { equals: rawIdentifier, mode: 'insensitive' } } },
          { teacher: { teacherCode: { equals: rawIdentifier, mode: 'insensitive' } } },
        ],
      },
      include: {
        student: true,
        teacher: true,
      },
    });

    const genericResponse = {
      message: 'Nếu thông tin khớp với tài khoản đang hoạt động, mã xác thực sẽ được gửi đến email đã đăng ký.',
      emailMasked: 'email đã đăng ký',
      resetSessionId: randomBytes(16).toString('hex'),
    };

    if (!user || user.status !== 'ACTIVE') {
      return genericResponse;
    }

    // Generate the OTP with a cryptographically secure random source.
    const code = randomInt(100000, 1000000).toString();
    const resetSessionId = randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const otpData = {
      sessionId: resetSessionId,
      code,
      userId: user.id,
      email: user.email,
      expiresAt,
      attempts: 0,
    };

    this.otpStore.set(resetSessionId, otpData);
    this.otpStore.set(`user_${user.id}`, otpData);

    const displayName = user.student?.fullName || user.teacher?.fullName || user.username;
    const emailHtml = `
      <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 700;">Hệ Thống Quản Lý Khảo Thí</h2>
          <p style="color: #64748b; margin: 4px 0 0; font-size: 14px;">Yêu cầu đặt lại mật khẩu</p>
        </div>
        <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid #dbeafe;">
          <p style="color: #1e40af; margin: 0 0 12px; font-size: 14px; font-weight: 600;">MÃ XÁC THỰC OTP CỦA BẠN</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; background: #ffffff; padding: 12px 24px; border-radius: 8px; display: inline-block; border: 1px dashed #93c5fd; box-shadow: 0 2px 8px rgba(37,99,235,0.08);">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 13px; margin: 12px 0 0;">Mã có hiệu lực trong vòng <strong style="color: #1e293b;">10 phút</strong>. Tuyệt đối không chia sẻ mã này cho người khác.</p>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Xin chào <strong>${displayName}</strong>,<br>
          Hệ thống vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${user.username}</strong>. Hãy sử dụng mã OTP ở trên để tiến hành đặt mật khẩu mới.
        </p>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 20px;">
          Nếu bạn không gửi yêu cầu này, hãy yên tâm bỏ qua email hoặc liên hệ Quản trị viên để kiểm tra an toàn tài khoản.
        </p>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
          &copy; Hệ Thống Quản Lý Khảo Thí &bull; Email tự động bảo mật cao
        </div>
      </div>
    `;

    try {
      await this.contactService.sendEmail({
        to: user.email,
        subject: '[Khảo Thí] Mã xác thực OTP đặt lại mật khẩu',
        text: `Mã xác thực OTP của bạn là: ${code}. Mã có hiệu lực trong 10 phút.`,
        html: emailHtml,
      });
      this.logger.log(`Đã gửi email OTP đặt lại mật khẩu cho user ID ${user.id} (${user.email})`);
    } catch (mailErr: any) {
      this.logger.warn(
        `Chưa cấu hình hoặc gửi SMTP thất bại: ${mailErr?.message}.`,
      );
    }

    return {
      ...genericResponse,
      resetSessionId,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const rawIdentifier = dto.identifier.trim();
    const rawOtp = dto.otp.trim();

    let entry = dto.resetSessionId ? this.otpStore.get(dto.resetSessionId) : null;

    if (!entry) {
      // Tìm theo user identifier
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: rawIdentifier, mode: 'insensitive' } },
            { username: { equals: rawIdentifier, mode: 'insensitive' } },
            { student: { studentCode: { equals: rawIdentifier, mode: 'insensitive' } } },
            { teacher: { teacherCode: { equals: rawIdentifier, mode: 'insensitive' } } },
          ],
        },
      });
      if (user) {
        entry = this.otpStore.get(`user_${user.id}`);
      }
    }

    if (!entry) {
      throw new BadRequestException('Không tìm thấy phiên xác thực OTP hoặc phiên đã kết thúc. Vui lòng yêu cầu mã mới.');
    }

    if (Date.now() > entry.expiresAt) {
      throw new BadRequestException('Mã OTP đã hết hiệu lực (quá 10 phút). Vui lòng yêu cầu mã OTP mới.');
    }

    if (entry.attempts >= 5) {
      throw new BadRequestException('Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng yêu cầu mã mới để tiếp tục.');
    }

    if (entry.code !== rawOtp) {
      entry.attempts++;
      const remaining = 5 - entry.attempts;
      throw new BadRequestException(
        remaining > 0
          ? `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`
          : 'Mã OTP không chính xác. Vui lòng yêu cầu mã mới.',
      );
    }

    // Signed password reset token with 15-minute expiration
    const resetToken = this.jwtService.sign(
      { sub: entry.userId, scope: 'password_reset', resetSessionId: entry.sessionId },
      { expiresIn: '15m' },
    );

    return {
      message: 'Xác thực mã OTP thành công! Vui lòng đặt mật khẩu mới.',
      resetToken,
    };
  }

  async resetPasswordWithToken(dto: ResetPasswordDto) {
    if (!dto.resetToken) {
      throw new BadRequestException('Thiếu token xác thực đặt lại mật khẩu.');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(dto.resetToken);
    } catch {
      throw new UnauthorizedException('Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (quá 15 phút).');
    }

    if (payload.scope !== 'password_reset' || !payload.sub || !payload.resetSessionId) {
      throw new UnauthorizedException('Token không có quyền thực hiện đặt lại mật khẩu.');
    }

    const resetEntry = this.otpStore.get(String(payload.resetSessionId));
    if (!resetEntry || resetEntry.userId !== Number(payload.sub) || resetEntry.expiresAt <= Date.now()) {
      throw new UnauthorizedException('Phiên đặt lại mật khẩu đã được sử dụng hoặc đã hết hạn.');
    }

    const newPassword = String(dto.newPassword || '').trim();
    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    }
    if (dto.confirmPassword && dto.confirmPassword !== newPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không trùng khớp.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: Number(payload.sub) },
    });

    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại trên hệ thống.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalidate all active sessions to enforce fresh login with new password
    await this.prisma.authSession.deleteMany({
      where: { userId: user.id },
    });

    // Clean up OTP store
    this.otpStore.delete(`user_${user.id}`);
    this.otpStore.delete(String(payload.resetSessionId));

    // Audit log
    await this.audit.write({
      actorId: user.id,
      action: 'PASSWORD_RESET',
      entityType: 'AUTH',
      entityId: user.id,
      description: `Người dùng ${user.username} đã đặt lại mật khẩu thành công qua OTP email.`,
    });

    return {
      message: 'Đặt lại mật khẩu thành công! Hãy đăng nhập lại bằng mật khẩu mới của bạn.',
    };
  }

  private maskEmail(email?: string): string {
    if (!email || !email.includes('@')) return 'email đã đăng ký';
    const [name, domain] = email.split('@');
    if (name.length <= 2) {
      return `${name.charAt(0)}***@${domain}`;
    }
    const visibleStart = name.slice(0, 2);
    const visibleEnd = name.slice(-1);
    return `${visibleStart}***${visibleEnd}@${domain}`;
  }
}
