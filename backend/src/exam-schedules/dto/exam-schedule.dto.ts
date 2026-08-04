import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const statuses = ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const;
const examTypes = ['TRAC_NGHIEM', 'TU_LUAN'] as const;

export class CreateExamScheduleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examPeriodId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId: number;

  @IsISO8601({ strict: true })
  examDate: string;

  @Matches(timePattern)
  startTime: string;

  @Matches(timePattern)
  endTime: string;

  @IsOptional()
  @IsIn(examTypes)
  examType?: (typeof examTypes)[number];

  @IsOptional()
  @IsIn(statuses)
  status?: (typeof statuses)[number];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateExamScheduleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examPeriodId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId?: number;

  @IsOptional()
  @IsISO8601({ strict: true })
  examDate?: string;

  @IsOptional()
  @Matches(timePattern)
  startTime?: string;

  @IsOptional()
  @Matches(timePattern)
  endTime?: string;

  @IsOptional()
  @IsIn(examTypes)
  examType?: (typeof examTypes)[number];

  @IsOptional()
  @IsIn(statuses)
  status?: (typeof statuses)[number];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class FindExamSchedulesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examPeriodId?: number;
}
