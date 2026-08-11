import { Controller, Post, Get, Body, Query, Res, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly refreshCookieName = 'exam_refresh_token';

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
    const raw = String(req.headers?.cookie || '');
    const match = raw.match(new RegExp(`(?:^|;\\s*)${this.refreshCookieName}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : undefined;
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
  @Get('google')
  googleAuth(@Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const url = this.authService.getGoogleAuthUrl();
      return res.redirect(url);
    } catch (err: any) {
      const errorMsg = encodeURIComponent(err.message || 'Chưa cấu hình Google Client ID.');
      return res.redirect(`${frontendUrl}/login?google_error=${errorMsg}`);
    }
  }

  @Public()
  @Get('google/callback')
  async googleAuthCallback(@Query('code') code: string, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
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
