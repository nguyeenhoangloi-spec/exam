import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
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
  @IsUUID()
  @IsNotEmpty()
  backupJobId!: string;

  @IsEnum(BackupRestoreTarget)
  target!: BackupRestoreTarget;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class ApproveRestoreRequestDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  confirmationPhrase!: string;
}

export class RejectRestoreRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
