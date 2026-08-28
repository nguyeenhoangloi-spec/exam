import { Module } from '@nestjs/common';
import { ExamArchivesService } from './exam-archives.service';
import { ExamArchivesController } from './exam-archives.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AccessControlModule } from '../access-control/access-control.module';

import { ExamArchivesConfigService } from './exam-archives-config.service';

@Module({
  imports: [PrismaModule, AuditModule, AccessControlModule],
  controllers: [ExamArchivesController],
  providers: [ExamArchivesService, ExamArchivesConfigService],
  exports: [ExamArchivesService, ExamArchivesConfigService],
})
export class ExamArchivesModule {}
