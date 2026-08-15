import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class RubricCriterionDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên tiêu chí không được để trống.' })
  label!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  fullCreditGuide?: string;

  @IsString()
  @IsOptional()
  partialCreditGuide?: string;

  @IsString()
  @IsOptional()
  zeroCreditGuide?: string;

  @IsString()
  @IsOptional()
  acceptedConcepts?: string;

  @IsString()
  @IsOptional()
  commonMistakes?: string;

  @IsNumber({}, { message: 'Bước điểm phải là số.' })
  @Min(0.01, { message: 'Bước điểm phải lớn hơn 0.' })
  @Max(100, { message: 'Bước điểm không vượt quá 100.' })
  @IsOptional()
  scoreStep?: number;

  @IsNumber({}, { message: 'Điểm tối đa phải là số.' })
  @Min(0.01, { message: 'Điểm tối đa của tiêu chí phải lớn hơn 0.' })
  @Max(100, { message: 'Điểm tối đa không vượt quá 100.' })
  maxScore!: number;

  @IsNumber()
  @Min(0, { message: 'Thứ tự không được là số âm.' })
  sortOrder!: number;
}

export class RubricDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Rubric phải có ít nhất 1 tiêu chí.' })
  @ValidateNested({ each: true })
  @Type(() => RubricCriterionDto)
  criteria!: RubricCriterionDto[];

  @IsString()
  @IsOptional()
  referenceAnswer?: string;

  @IsString()
  @IsOptional()
  gradingGuidance?: string;
}

export class GradeCriterionDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã tiêu chí không được để trống.' })
  criterionId!: string;

  @IsNumber({}, { message: 'Điểm số phải là số.' })
  @Min(0, { message: 'Điểm số không được nhỏ hơn 0.' })
  score!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class GradeAnswerDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeCriterionDto)
  criteria!: GradeCriterionDto[];

  @IsString()
  @IsOptional()
  teacherComment?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ActionReasonDto {
  @IsString()
  @IsNotEmpty({ message: 'Bắt buộc phải nhập lý do thao tác.' })
  reason!: string;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Số phút gia hạn tối thiểu 1 phút.' })
  @Max(240, { message: 'Số phút gia hạn tối đa 240 phút.' })
  extraMinutes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Điểm phạt không được là số âm.' })
  penaltyPoints?: number;
}
