import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export const SYSTEM_ROLES = ['ADMIN', 'TEACHER', 'STUDENT'] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

export class UpdateRolePermissionDto {
  @IsString()
  @IsNotEmpty()
  permissionCode!: string;

  @IsBoolean()
  granted!: boolean;
}

export class UpsertUserPermissionOverrideDto {
  @IsString()
  @IsNotEmpty()
  permissionCode!: string;

  @IsEnum(['ALLOW', 'DENY'])
  effect!: 'ALLOW' | 'DENY';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ReplaceUserScopesDto {
  @IsArray()
  @ArrayMaxSize(200)
  scopes!: Array<{
    type: 'DEPARTMENT' | 'CLASS' | 'SUBJECT';
    resourceId: number;
  }>;
}

export class AccessScopeDto {
  @IsEnum(['DEPARTMENT', 'CLASS', 'SUBJECT'])
  type!: 'DEPARTMENT' | 'CLASS' | 'SUBJECT';

  @IsInt()
  @Min(1)
  resourceId!: number;
}
