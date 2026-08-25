import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateTeacherDto {
  @IsString() @MinLength(1) @MaxLength(50) teacherCode: string;
  @IsString() @MinLength(2) @MaxLength(255) fullName: string;
  @IsString() @MinLength(1) @MaxLength(100) degree: string;
  @IsEmail() @MaxLength(255) email: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @Type(() => Number) @IsInt() @Min(1) departmentId: number;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(100) username?: string;
  @IsOptional() @IsString() @MinLength(6) @MaxLength(100) password?: string;
}

export class UpdateTeacherDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(50) teacherCode?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(255) fullName?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) degree?: string;
  @IsOptional() @IsEmail() @MaxLength(255) email?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) departmentId?: number;
}

export class UpdateDutyAvailabilityDto {
  @IsString() examDate: string;
  @IsString() @MaxLength(10) startTime: string;
  @IsString() @MaxLength(10) endTime: string;
  @IsIn(['AVAILABLE', 'UNAVAILABLE']) status: 'AVAILABLE' | 'UNAVAILABLE';
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class CreateSupervisorChangeRequestDto {
  @IsString() @MinLength(10) @MaxLength(500) reason: string;
}

export class ReviewSupervisorChangeRequestDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) replacementTeacherId?: number;
  @IsOptional() @IsString() @MaxLength(500) reviewNote?: string;
}
