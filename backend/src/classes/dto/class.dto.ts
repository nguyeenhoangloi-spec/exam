import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateClassDto {
  @IsString() @MinLength(1) @MaxLength(50)
  code: string;

  @IsString() @MinLength(2) @MaxLength(255)
  name: string;

  @Type(() => Number) @IsInt() @Min(1)
  departmentId: number;
}

export class UpdateClassDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(50)
  code?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(255)
  name?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  departmentId?: number;
}
