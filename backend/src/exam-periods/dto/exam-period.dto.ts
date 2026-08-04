import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const periodStatuses = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const;

export class CreateExamPeriodDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  semester: string;

  @IsString()
  @MinLength(4)
  @MaxLength(30)
  schoolYear: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsIn(periodStatuses)
  status?: (typeof periodStatuses)[number];
}

export class UpdateExamPeriodDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  semester?: string;

  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  schoolYear?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(periodStatuses)
  status?: (typeof periodStatuses)[number];
}
