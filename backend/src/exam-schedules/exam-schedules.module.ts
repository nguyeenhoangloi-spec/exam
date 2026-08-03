import { Module } from '@nestjs/common';
import { ExamSchedulesService } from './exam-schedules.service';
import { ExamSchedulesController } from './exam-schedules.controller';

@Module({
  controllers: [ExamSchedulesController],
  providers: [ExamSchedulesService],
  exports: [ExamSchedulesService],
})
export class ExamSchedulesModule {}
