import { Module } from '@nestjs/common';
import { EssayController } from './essay.controller';
import { EssayGradingController } from './essay-grading.controller';
import { EssayConfigController } from './essay-config.controller';
import { EssayService } from './essay.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [EssayController, EssayGradingController, EssayConfigController],
  providers: [EssayService],
  exports: [EssayService],
})
export class EssayModule {}
