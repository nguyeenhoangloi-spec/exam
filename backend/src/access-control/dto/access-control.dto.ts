import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const SYSTEM_ROLES = ['ADMIN', 'TEACHER', 'STUDENT'] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

export class RolePermissionChangeDto {
  @IsString()
  @IsNotEmpty()
  permissionCode!: string;

  @IsBoolean()
  granted!: boolean;
}

export class UpdateRolePermissionDto extends RolePermissionChangeDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

export class UpdateRolePermissionsBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => RolePermissionChangeDto)
  changes!: RolePermissionChangeDto[];

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

export class UpsertUserPermissionOverrideDto {
  @IsString()
  @IsNotEmpty()
  permissionCode!: string;

  @IsEnum(['ALLOW', 'DENY'])
  effect!: 'ALLOW' | 'DENY';

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason?: string;
}

export class AccessScopeDto {
  @IsEnum(['DEPARTMENT', 'CLASS', 'SUBJECT'])
  type!: 'DEPARTMENT' | 'CLASS' | 'SUBJECT';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  resourceId!: number;
}

export class ReplaceUserScopesDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => AccessScopeDto)
  scopes!: AccessScopeDto[];

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

export class PermissionContextDto {
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId?: number;
}

export class SimulatePermissionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @IsString()
  @IsNotEmpty()
  permissionCode!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PermissionContextDto)
  context?: PermissionContextDto;
}
