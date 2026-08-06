import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateRandomExamPaperDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examScheduleId: number;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'Mã đề chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới.' })
  @MaxLength(30)
  paperCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsIn(['TRAC_NGHIEM', 'TU_LUAN'])
  examType?: 'TRAC_NGHIEM' | 'TU_LUAN';

  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(300)
  durationMinutes: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  easyCount: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  mediumCount: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(200)
  hardCount: number;

  @IsOptional()
  @IsBoolean()
  confirm?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  variantCount?: number;
}

export class ExamPaperQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examScheduleId?: number;
}
