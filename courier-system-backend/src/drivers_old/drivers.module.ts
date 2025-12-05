// src/drivers/drivers.module.ts
import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [PrismaModule],
  providers: [DriversService],
  controllers: [DriversController],
})
export class DriversModule {}
