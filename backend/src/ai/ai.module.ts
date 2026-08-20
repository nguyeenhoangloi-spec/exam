import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiProvider } from './providers/gemini.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [GeminiProvider, DeepSeekProvider, AiService],
  exports: [AiService, DeepSeekProvider],
})
export class AiModule {}
