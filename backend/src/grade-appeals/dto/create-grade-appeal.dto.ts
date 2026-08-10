import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateGradeAppealDto {
  @IsNotEmpty({ message: 'Lượt thi (attemptId) không được để trống' })
  @IsUUID('4', { message: 'Mã lượt thi (attemptId) không hợp lệ' })
  attemptId: string;

  @IsNotEmpty({ message: 'Lý do phúc khảo không được để trống' })
  @IsString()
  @MaxLength(2000, { message: 'Lý do phúc khảo không quá 2000 ký tự' })
  reason: string;

  @IsOptional()
  evidenceUrls?: any;
}
