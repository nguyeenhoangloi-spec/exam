import { Module } from '@nestjs/common';
import { GradeAppealsService } from './grade-appeals.service';
import { GradeAppealsController } from './grade-appeals.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [GradeAppealsController],
  providers: [GradeAppealsService],
  exports: [GradeAppealsService],
})
export class GradeAppealsModule {}
