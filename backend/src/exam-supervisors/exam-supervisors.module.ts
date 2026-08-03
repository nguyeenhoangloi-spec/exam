import { Module } from '@nestjs/common';
import { ExamSupervisorsService } from './exam-supervisors.service';
import { ExamSupervisorsController } from './exam-supervisors.controller';

@Module({
  controllers: [ExamSupervisorsController],
  providers: [ExamSupervisorsService],
  exports: [ExamSupervisorsService],
})
export class ExamSupervisorsModule {}
