import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class RubricCriterionDto {
  @IsString() @IsNotEmpty() label!: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() @Min(0) @Max(100) maxScore!: number;
  @IsNumber() @Min(0) sortOrder!: number;
}

export class RubricDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => RubricCriterionDto)
  criteria!: RubricCriterionDto[];
}

export class GradeCriterionDto {
  @IsString() @IsNotEmpty() criterionId!: string;
  @IsNumber() @Min(0) score!: number;
  @IsString() @IsOptional() comment?: string;
}

export class GradeAnswerDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => GradeCriterionDto)
  criteria!: GradeCriterionDto[];
  @IsString() @IsOptional() teacherComment?: string;
}

export class ActionReasonDto {
  @IsString() @IsNotEmpty() reason!: string;
  @IsNumber() @IsOptional() @Min(1) @Max(240) extraMinutes?: number;
  @IsNumber() @IsOptional() @Min(0) penaltyPoints?: number;
}
