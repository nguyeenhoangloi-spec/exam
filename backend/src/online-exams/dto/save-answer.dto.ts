import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class FillBlankResponseDto {
  @IsInt()
  @Min(1)
  @Max(20)
  blankIndex: number;

  @IsString()
  @Max(2000)
  value: string;
}

export class SaveAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsArray()
  @IsOptional()
  selectedOptionIds?: string[];

  @IsString()
  @IsOptional()
  textAnswer?: string;

  @IsOptional()
  textAnswerRich?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FillBlankResponseDto)
  fillBlankAnswers?: FillBlankResponseDto[];

  @IsBoolean()
  @IsOptional()
  isFlaggedForReview?: boolean;

  @IsNumber()
  @IsNotEmpty()
  version: number;

  @IsString()
  @IsNotEmpty()
  clientTimestamp: string;
}

export class SaveAnswersBatchDto {
  @IsArray()
  answers: SaveAnswerDto[];
}
