import { IsOptional, IsString, MaxLength, MinLength, IsInt, Min, IsNotEmpty, IsIn } from 'class-validator';
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
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId: number;

  @IsOptional() @IsString() @IsIn(['MANDATORY', 'ELECTIVE'])
  type?: 'MANDATORY' | 'ELECTIVE';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recommendedSemester?: number;

  @IsOptional() @IsString()
  note?: string;
}
