import { IsOptional, IsString, MaxLength, MinLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDepartmentDto {
  @IsString() @MinLength(1) @MaxLength(30)
  code: string;

  @IsString() @MinLength(2) @MaxLength(255)
  name: string;
}

export class UpdateDepartmentDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(30)
  code?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(255)
  name?: string;
}

export class AddCurriculumSubjectDto {
  subjectId: any;

  @IsOptional() @IsString()
  type?: 'MANDATORY' | 'ELECTIVE';

  @IsOptional()
  recommendedSemester?: any;

  @IsOptional() @IsString()
  note?: string;
}
