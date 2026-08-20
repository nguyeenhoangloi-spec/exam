import { Controller, Post, Get, Body, Query, Res, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { randomBytes, timingSafeEqual } from 'node:crypto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly refreshCookieName = 'exam_refresh_token';
  private readonly oauthStateCookieName = 'exam_oauth_state';

  private cookieOptions() {
    const secure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/auth',
      maxAge: Math.max(1, Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS || 30)) * 24 * 60 * 60 * 1000,
    };
  }

  private readRefreshToken(req: any) {
    return this.readCookie(req, this.refreshCookieName);
  }

  private readCookie(req: any, name: string) {
    const raw = String(req.headers?.cookie || '');
    const match = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : undefined;
  }

  private validOAuthState(received?: string, expected?: string) {
    if (!received || !expected) return false;
    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);
    return receivedBuffer.length === expectedBuffer.length
      && timingSafeEqual(receivedBuffer, expectedBuffer);
  }

  private sendSession(result: any, response: Response) {
    response.cookie(this.refreshCookieName, result.refreshToken, this.cookieOptions());
    return { accessToken: result.accessToken, user: result.user };
  }

  private clearSession(response: Response) {
    response.clearCookie(this.refreshCookieName, this.cookieOptions());
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    return this.sendSession(await this.authService.login(loginDto), response);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPasswordWithToken(dto);
  }

  @Public()
  @Get('google')
  googleAuth(@Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const state = randomBytes(32).toString('base64url');
      const secure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
      res.cookie(this.oauthStateCookieName, state, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/auth/google/callback',
        maxAge: 10 * 60 * 1000,
      });
      const url = this.authService.getGoogleAuthUrl(state);
      return res.redirect(url);
    } catch (err: any) {
      const errorMsg = encodeURIComponent(err.message || 'Chưa cấu hình Google Client ID.');
      return res.redirect(`${frontendUrl}/login?google_error=${errorMsg}`);
    }
  }

  @Public()
  @Get('google/callback')
  async googleAuthCallback(
    @Request() req: any,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') oauthError: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const expectedState = this.readCookie(req, this.oauthStateCookieName);
      res.clearCookie(this.oauthStateCookieName, { path: '/auth/google/callback' });
      if (!this.validOAuthState(state, expectedState)) {
        throw new BadRequestException('Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn.');
      }
      if (oauthError === 'access_denied') {
        return res.redirect(`${frontendUrl}/login?google_error=${encodeURIComponent('Bạn đã hủy đăng nhập Google.')}`);
      }
      if (oauthError || !code) {
        throw new BadRequestException('Google không thể hoàn tất đăng nhập. Vui lòng thử lại.');
      }
      const result = await this.authService.handleGoogleCallback(code);
      this.sendSession(result, res);
      return res.redirect(`${frontendUrl}/login?google=success`);
    } catch (err: any) {
      const errorMsg = encodeURIComponent(err.message || 'Đăng nhập bằng Google thất bại.');
      return res.redirect(`${frontendUrl}/login?google_error=${errorMsg}`);
    }
  }

  @Public()
  @Post('google')
  async loginWithGoogle(@Body() dto: { idToken?: string; credential?: string; code?: string }, @Res({ passthrough: true }) response: Response) {
    if (dto.code) {
      return this.sendSession(await this.authService.handleGoogleCallback(dto.code), response);
    }
    const token = dto.idToken || dto.credential;
    if (!token) {
      throw new BadRequestException('Thiếu thông tin xác thực Google.');
    }
    return this.sendSession(await this.authService.loginWithGoogleToken(token), response);
  }

  @Public()
  @Post('refresh')
  async refresh(@Request() req: any, @Res({ passthrough: true }) response: Response) {
    return this.sendSession(await this.authService.refresh(this.readRefreshToken(req)), response);
  }

  @Public()
  @Post('logout')
  async logout(@Request() req: any, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(this.readRefreshToken(req));
    this.clearSession(response);
    return { message: 'Đã đăng xuất.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub || req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub || req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async updateProfile(@Request() req: any, @Body() dto: { fullName?: string; email?: string; phone?: string }) {
    return this.authService.updateProfile(req.user.sub || req.user.id, dto);
  }
}
