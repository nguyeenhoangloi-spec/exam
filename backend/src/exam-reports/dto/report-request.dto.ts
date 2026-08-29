import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum ExamReportType {
  EXAM_SUMMARY = 'EXAM_SUMMARY',
  RESULTS_BY_SCHEDULE = 'RESULTS_BY_SCHEDULE',
  SCORE_DISTRIBUTION = 'SCORE_DISTRIBUTION',
  ATTENDANCE = 'ATTENDANCE',
  GRADING_PROGRESS = 'GRADING_PROGRESS',
  INCIDENTS = 'INCIDENTS',
  GRADE_APPEALS = 'GRADE_APPEALS',
}

export enum ExamReportExportFormat {
  CSV = 'CSV',
  XLSX = 'XLSX',
}

export class ExamReportFiltersDto {
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  classId?: number;

  @IsOptional()
  @IsDateString({ strict: true })
  fromDate?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  toDate?: string;
}

export class ExamReportPreviewDto {
  @IsEnum(ExamReportType)
  type: ExamReportType;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExamReportFiltersDto)
  filters?: ExamReportFiltersDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  customLabels?: Record<string, string>;

  @IsOptional()
  @IsString()
  scoreRounding?: '0.1' | '0.25' | '0.5';

  @IsOptional()
  @Type(() => Number)
  passThreshold?: number;
}

export class ExamReportExportDto extends ExamReportPreviewDto {
  @IsEnum(ExamReportExportFormat)
  format: ExamReportExportFormat;
}
