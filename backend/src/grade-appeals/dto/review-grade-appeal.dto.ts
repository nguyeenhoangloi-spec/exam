import { IsEnum, IsNumber, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';
import { GradeAppealStatus } from '@prisma/client';

export class ReviewGradeAppealDto {
  @IsEnum(GradeAppealStatus, { message: 'Trạng thái phúc khảo không hợp lệ' })
  status: GradeAppealStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Điểm mới phải là số' })
  @Min(0, { message: 'Điểm số không được nhỏ hơn 0' })
  @Max(100, { message: 'Điểm số không được vượt quá 100' })
  revisedScore?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Ghi chú đánh giá không vượt quá 2000 ký tự' })
  reviewerNote?: string;
}
