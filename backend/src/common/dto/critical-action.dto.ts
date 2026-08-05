import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ConfirmCriticalActionDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu tài khoản hiện tại.' })
  @MinLength(1, { message: 'Mật khẩu không được để trống.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn hoặc nhập lý do thực hiện thao tác.' })
  reason: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập cụm từ xác nhận.' })
  confirmPhrase: string;
}
