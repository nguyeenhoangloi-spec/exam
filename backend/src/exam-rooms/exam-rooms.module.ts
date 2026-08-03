import { Module } from '@nestjs/common';
import { ExamRoomsService } from './exam-rooms.service';
import { ExamRoomsController } from './exam-rooms.controller';

@Module({
  controllers: [ExamRoomsController],
  providers: [ExamRoomsService],
  exports: [ExamRoomsService],
})
export class ExamRoomsModule {}
