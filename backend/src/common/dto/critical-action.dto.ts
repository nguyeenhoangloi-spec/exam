import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  /**
   * Mật khẩu thi chính thức (dạng plaintext) do Giảng viên/Admin thiết lập
   * khi phát hành đề thi. Backend sẽ hash bcrypt và lưu vào OnlineExamConfig.examPasswordHash.
   * Bắt buộc đối với kỳ thi chính thức (OFFICIAL).
   */
  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'Mật khẩu thi phải có ít nhất 4 ký tự.' })
  @MaxLength(50, { message: 'Mật khẩu thi tối đa 50 ký tự.' })
  examPassword?: string;
}
