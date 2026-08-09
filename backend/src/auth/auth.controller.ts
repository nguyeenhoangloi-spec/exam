import { Controller, Post, Get, Body, Query, Res, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

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

  @Get('google/callback')
  async googleAuthCallback(@Query('code') code: string, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    try {
      const result = await this.authService.handleGoogleCallback(code);
      const token = encodeURIComponent(result.accessToken);
      const user = encodeURIComponent(JSON.stringify(result.user));
      return res.redirect(`${frontendUrl}/login?google_token=${token}&google_user=${user}`);
    } catch (err: any) {
      const errorMsg = encodeURIComponent(err.message || 'Đăng nhập bằng Google thất bại.');
      return res.redirect(`${frontendUrl}/login?google_error=${errorMsg}`);
    }
  }

  @Post('google')
  async loginWithGoogle(@Body() dto: { idToken?: string; credential?: string; code?: string }) {
    if (dto.code) {
      return this.authService.handleGoogleCallback(dto.code);
    }
    const token = dto.idToken || dto.credential;
    if (!token) {
      throw new BadRequestException('Thiếu thông tin xác thực Google.');
    }
    return this.authService.loginWithGoogleToken(token);
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

