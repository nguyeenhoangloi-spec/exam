import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

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
}
