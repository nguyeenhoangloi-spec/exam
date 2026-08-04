import { Module } from '@nestjs/common';
import { ExamRoomsService } from './exam-rooms.service';
import { ExamRoomsController } from './exam-rooms.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ExamRoomsController],
  providers: [ExamRoomsService],
  exports: [ExamRoomsService],
})
export class ExamRoomsModule {}
