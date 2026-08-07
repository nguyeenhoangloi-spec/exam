import { Module } from '@nestjs/common';
import { OnlineExamsController } from './online-exams.controller';
import { OnlineExamsService } from './online-exams.service';
import { EligibilityCheckerService } from './eligibility-checker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EssayModule } from '../essay/essay.module';

@Module({
  imports: [PrismaModule, EssayModule],
  controllers: [OnlineExamsController],
  providers: [OnlineExamsService, EligibilityCheckerService],
  exports: [OnlineExamsService, EligibilityCheckerService],
})
export class OnlineExamsModule {}
