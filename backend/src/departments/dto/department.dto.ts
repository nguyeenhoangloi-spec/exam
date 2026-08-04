import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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
  @IsString()
  subjectId: number;

  @IsOptional() @IsString()
  type?: 'MANDATORY' | 'ELECTIVE';

  @IsOptional()
  recommendedSemester?: number;

  @IsOptional() @IsString()
  note?: string;
}
