import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupStorageService } from './backup-storage.service';
import { BackupWorker } from './backup.worker';

@Module({
  controllers: [BackupController],
  providers: [BackupService, BackupStorageService, BackupWorker],
  exports: [BackupService],
})
export class BackupsModule {}
