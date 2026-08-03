import { Module } from '@nestjs/common';
import { ExamPapersService } from './exam-papers.service';
import { ExamPapersController } from './exam-papers.controller';

@Module({
  controllers: [ExamPapersController],
  providers: [ExamPapersService],
  exports: [ExamPapersService],
})
export class ExamPapersModule {}
