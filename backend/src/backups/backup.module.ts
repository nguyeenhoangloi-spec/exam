import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupStorageService } from './backup-storage.service';
import { BackupWorker } from './backup.worker';
import { BackupConfigService } from './backup-config.service';

@Module({
  controllers: [BackupController],
  providers: [BackupService, BackupConfigService, BackupStorageService, BackupWorker],
  exports: [BackupService],
})
export class BackupsModule {}
