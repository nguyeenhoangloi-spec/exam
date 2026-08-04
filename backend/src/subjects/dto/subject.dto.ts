import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateSubjectDto {
  @IsString() @MinLength(1) @MaxLength(50)
  subjectCode: string;

  @IsString() @MinLength(2) @MaxLength(255)
  subjectName: string;

  @Type(() => Number) @IsInt() @Min(1) @Max(100)
  credits: number;

  @Type(() => Number) @IsInt() @Min(1)
  departmentId: number;
}

export class UpdateSubjectDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(50)
  subjectCode?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(255)
  subjectName?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  credits?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  departmentId?: number;
}
