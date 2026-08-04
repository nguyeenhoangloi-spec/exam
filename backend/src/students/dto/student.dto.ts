import { Type } from 'class-transformer';
import { IsDateString, IsEmail, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateStudentDto {
  @IsString() @MinLength(1) @MaxLength(50) studentCode: string;
  @IsString() @MinLength(2) @MaxLength(255) fullName: string;
  @IsString() @MinLength(1) @MaxLength(30) gender: string;
  @IsDateString() dateOfBirth: string;
  @IsEmail() @MaxLength(255) email: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @Type(() => Number) @IsInt() @Min(1) classId: number;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(100) username?: string;
  @IsOptional() @IsString() @MinLength(6) @MaxLength(100) password?: string;
}

export class UpdateStudentDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(50) studentCode?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(255) fullName?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(30) gender?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsEmail() @MaxLength(255) email?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) classId?: number;
}
