import { IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsString({ message: 'Thông tin tài khoản không hợp lệ.' })
  @IsNotEmpty({ message: 'Vui lòng nhập Email, Tên đăng nhập hoặc Mã số.' })
  identifier: string;
}
