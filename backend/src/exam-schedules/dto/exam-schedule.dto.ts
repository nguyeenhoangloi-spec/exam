import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsInt, IsISO8601, IsOptional, IsString, Matches, MaxLength, Min, ValidateNested } from 'class-validator';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const statuses = ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'LOCKED'] as const;
const examTypes = ['TRAC_NGHIEM', 'TU_LUAN', 'DIEN_LO'] as const;

const modes = ['MOCK', 'OFFICIAL'] as const;

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
  @IsIn(modes)
  mode?: (typeof modes)[number];

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
  @IsIn(modes)
  mode?: (typeof modes)[number];

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

  @IsOptional()
  @IsIn(modes)
  mode?: (typeof modes)[number];
}

export class ReopenEntryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minutes?: number;
}

export class AutoSchedulePreviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examPeriodId: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  subjectIds?: number[];
}

export class AutoScheduleProposalDto {
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
}

export class AutoScheduleAcceptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AutoScheduleProposalDto)
  proposals: AutoScheduleProposalDto[];
}
