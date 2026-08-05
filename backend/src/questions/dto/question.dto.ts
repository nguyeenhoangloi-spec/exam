import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const TYPES = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY'];
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const BLOOMS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'];
const STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'];

export class QuestionOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  label: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsInt()
  @Min(0)
  @Max(99)
  order: number;
}

export class CreateQuestionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId: number;

  @IsOptional()
  @IsUUID()
  chapterId?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(10000)
  content: string;

  @IsIn(TYPES)
  type: any;

  @IsIn(DIFFICULTIES)
  difficulty: any;

  @IsIn(BLOOMS)
  bloomLevel: any;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(100)
  score: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  explanation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  keywords?: string;

  @IsOptional()
  @IsBoolean()
  overrideDuplicate?: boolean;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];
}

export class UpdateQuestionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId?: number;

  @IsOptional()
  @IsUUID()
  chapterId?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(10000)
  content?: string;

  @IsOptional()
  @IsIn(TYPES)
  type?: any;

  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: any;

  @IsOptional()
  @IsIn(BLOOMS)
  bloomLevel?: any;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  explanation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  keywords?: string;

  @IsOptional()
  @IsBoolean()
  overrideDuplicate?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}

export class QuestionQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : String(value).trim()))
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  subjectId?: number;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : String(value)))
  @IsUUID()
  chapterId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : String(value)))
  @IsIn(TYPES)
  type?: any;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : String(value)))
  @IsIn(DIFFICULTIES)
  difficulty?: any;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : String(value)))
  @IsIn(BLOOMS)
  bloomLevel?: any;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : String(value)))
  @IsIn(STATUSES)
  status?: any;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : String(value)))
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : String(value)))
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'code', 'difficulty', 'status'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([20, 50, 100])
  limit?: number = 20;
}

export class RejectQuestionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}

export class BulkActionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids: string[];

  @IsIn(['SUBMIT', 'APPROVE', 'REJECT', 'ARCHIVE', 'RESTORE', 'DELETE', 'CHANGE_DIFFICULTY', 'CHANGE_CHAPTER'])
  action: string;

  @ValidateIf((o) => o.action === 'REJECT')
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason?: string;

  @ValidateIf((o) => o.action === 'CHANGE_DIFFICULTY')
  @IsIn(DIFFICULTIES)
  difficulty?: any;

  @ValidateIf((o) => o.action === 'CHANGE_CHAPTER')
  @IsUUID()
  chapterId?: string;
}

export class ImportConfirmDto {
  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @IsInt({ each: true })
  rows: number[];

  @IsOptional()
  @IsBoolean()
  overrideDuplicate?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) subjectId?: number;
  @IsOptional() @IsUUID() chapterId?: string;
  @IsOptional() @IsIn(TYPES) defaultType?: any;
  @IsOptional() @IsIn(DIFFICULTIES) defaultDifficulty?: any;
  @IsOptional() @IsIn(BLOOMS) defaultBloomLevel?: any;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0.01) @Max(100) defaultScore?: number;
  @IsOptional() @IsBoolean() applyDefaultsToMissingOnly?: boolean;
  @IsOptional() @IsString() @MaxLength(500000) overrides?: string;
}

export class ImportPreviewDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) subjectId?: number;
  @IsOptional() @IsUUID() chapterId?: string;
  @IsOptional() @IsIn(TYPES) defaultType?: any;
  @IsOptional() @IsIn(DIFFICULTIES) defaultDifficulty?: any;
  @IsOptional() @IsIn(BLOOMS) defaultBloomLevel?: any;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0.01) @Max(100) defaultScore?: number;
  @IsOptional() @IsBoolean() applyDefaultsToMissingOnly?: boolean;
}

export class GenerateAiQuestionsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId: number;

  @IsOptional()
  @IsUUID()
  chapterId?: string;

  @IsIn(TYPES)
  type: any;

  @IsIn(DIFFICULTIES)
  difficulty: any;

  @IsIn(BLOOMS)
  bloomLevel: any;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  count: number;

  @IsOptional()
  @IsString()
  @MaxLength(100000)
  prompt?: string;

  @IsOptional()
  @IsBoolean()
  isExtractionOnly?: boolean;
}

export class SaveAiQuestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
