import { SecurityAuditCategory, SecurityAuditOutcome } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SecurityAuditQueryDto {
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsEnum(SecurityAuditCategory) category?: SecurityAuditCategory;
  @IsOptional() @IsEnum(SecurityAuditOutcome) outcome?: SecurityAuditOutcome;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() actorId?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsBoolean() legalHold?: boolean;
}

export class UpdateRetentionPolicyDto {
  @IsInt() @Min(30) @Max(365) hotDays!: number;
  @IsInt() @Min(365) @Max(3650) retainDays!: number;
  @IsInt() @Min(1) @Max(365) rawIpDays!: number;
}

export class CreateLegalHoldDto {
  @IsString() reason!: string;
  @IsOptional() @IsString() caseReference?: string;
}
