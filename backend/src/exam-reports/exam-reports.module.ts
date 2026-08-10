import { Module } from '@nestjs/common';
import { ExamReportsController } from './exam-reports.controller';
import { ExamReportsService } from './exam-reports.service';

@Module({
  controllers: [ExamReportsController],
  providers: [ExamReportsService],
})
export class ExamReportsModule {}
