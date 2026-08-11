import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BackupRestoreTarget, BackupJobType } from '@prisma/client';

export class CreateBackupJobDto {
  @IsOptional()
  @IsEnum(BackupJobType)
  type?: BackupJobType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CreateRestoreRequestDto {
  @IsString()
  backupJobId!: string;

  @IsEnum(BackupRestoreTarget)
  target!: BackupRestoreTarget;

  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class ApproveRestoreRequestDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  confirmationPhrase!: string;
}

export class RejectRestoreRequestDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
