import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class RubricCriterionInputDto {
  @IsString()
  @IsNotEmpty()
  criterionId: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @Min(0)
  maxScore: number;

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
}

export class GradeEssayDto {
  @IsString()
  @IsNotEmpty()
  answerText: string;

  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsString()
  @IsOptional()
  sampleAnswer?: string;

  @IsNumber()
  @IsOptional()
  questionMaxScore?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricCriterionInputDto)
  criteria: RubricCriterionInputDto[];
}

export enum QuestionTypeEnum {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY',
}

export enum DifficultyEnum {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class GenerateQuestionDto {
  @IsString()
  @IsNotEmpty()
  subjectName: string;

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsEnum(QuestionTypeEnum)
  type: QuestionTypeEnum;

  @IsInt()
  @Min(1)
  @Max(10)
  count: number;

  @IsEnum(DifficultyEnum)
  @IsOptional()
  difficulty?: DifficultyEnum;
}
