import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';
import { BackupStorageProvider, BackupStorageRole } from '../backup-storage.types';

export class UpdateBackupSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoBackupEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  intervalDays?: number;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'backupTime phải có định dạng HH:mm (ví dụ 02:00)' })
  backupTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxRetentionCount?: number;

  @IsOptional()
  @IsBoolean()
  dualStorageEnabled?: boolean;

  @IsOptional()
  @IsString()
  secondaryPath?: string;

  @IsOptional()
  @IsString()
  primaryPath?: string;
}

export class BackupStorageTargetConfigDto {
  @IsOptional() @IsString() path?: string;
  @IsOptional() @IsString() endpoint?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() bucket?: string;
  @IsOptional() @IsString() prefix?: string;
  @IsOptional() @IsString() accountId?: string;
  @IsOptional() @IsString() accessKeyId?: string;
  @IsOptional() @IsString() secretAccessKey?: string;
  @IsOptional() @IsBoolean() forcePathStyle?: boolean;
  @IsOptional() @IsBoolean() serverSideEncryption?: boolean;
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsString() clientSecret?: string;
  @IsOptional() @IsString() refreshToken?: string;
  @IsOptional() @IsString() folderId?: string;
}

export class UpsertBackupStorageTargetDto {
  @IsString()
  name!: string;

  @IsIn(['LOCAL', 'R2', 'B2', 'S3', 'WASABI', 'MINIO', 'GOOGLE_DRIVE'])
  provider!: BackupStorageProvider;

  @IsIn(['PRIMARY', 'MIRROR'])
  role!: BackupStorageRole;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsObject()
  @ValidateNested()
  @Type(() => BackupStorageTargetConfigDto)
  config!: BackupStorageTargetConfigDto;
}

export class CompleteGoogleDriveConnectionDto {
  @IsString() code!: string;
  @IsString() state!: string;
}
