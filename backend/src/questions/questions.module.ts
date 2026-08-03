import { Module } from '@nestjs/common';
import { AiQuestionsService } from './ai.service';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, AiQuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
