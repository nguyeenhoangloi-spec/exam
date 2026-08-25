import { Module } from '@nestjs/common';
import { ExamSchedulesService } from './exam-schedules.service';
import { ExamSchedulesController } from './exam-schedules.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ExamSchedulesController],
  providers: [ExamSchedulesService],
  exports: [ExamSchedulesService],
})
export class ExamSchedulesModule {}

