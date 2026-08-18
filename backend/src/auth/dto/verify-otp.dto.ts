import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString({ message: 'Thông tin tài khoản không hợp lệ.' })
  @IsNotEmpty({ message: 'Vui lòng nhập Email, Tên đăng nhập hoặc Mã số.' })
  identifier: string;

  @IsString({ message: 'Mã OTP không hợp lệ.' })
  @Length(6, 6, { message: 'Mã OTP xác thực phải gồm đúng 6 chữ số.' })
  otp: string;

  @IsString()
  @IsOptional()
  resetSessionId?: string;
}
