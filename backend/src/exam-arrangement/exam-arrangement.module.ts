import { Module } from '@nestjs/common';
import { ExamArrangementService } from './exam-arrangement.service';
import { ExamArrangementController } from './exam-arrangement.controller';

@Module({
  controllers: [ExamArrangementController],
  providers: [ExamArrangementService],
  exports: [ExamArrangementService],
})
export class ExamArrangementModule {}
