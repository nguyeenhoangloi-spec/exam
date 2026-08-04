import { Module } from '@nestjs/common';
import { ProctorController } from './proctor.controller';
import { ProctorService } from './proctor.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProctorController],
  providers: [ProctorService],
  exports: [ProctorService],
})
export class ProctorModule {}
