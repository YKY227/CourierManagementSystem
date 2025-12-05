// src/jobs/jobs.module.ts
import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [JobsService],
  controllers: [JobsController],
})
export class JobsModule {}
