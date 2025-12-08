// src/driver/driver.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverJobsService } from './driver-jobs.service';
import { DriverJobsController } from './driver-jobs.controller';

@Module({
  imports: [PrismaModule],
  providers: [DriverJobsService],
  controllers: [DriverJobsController],
})
export class DriverModule {}
