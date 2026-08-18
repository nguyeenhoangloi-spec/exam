import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Token xác thực không hợp lệ.' })
  @IsNotEmpty({ message: 'Thiếu token xác thực đổi mật khẩu.' })
  resetToken: string;

  @IsString({ message: 'Mật khẩu mới không hợp lệ.' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
  @MaxLength(50, { message: 'Mật khẩu mới không được vượt quá 50 ký tự.' })
  newPassword: string;

  @IsString()
  @IsOptional()
  confirmPassword?: string;
}
