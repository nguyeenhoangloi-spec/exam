import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
