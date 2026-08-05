import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống.' })
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
  @MaxLength(50, { message: 'Mật khẩu mới không được vượt quá 50 ký tự.' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng xác nhận mật khẩu mới.' })
  confirmPassword: string;
}
