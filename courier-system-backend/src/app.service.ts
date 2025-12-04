// src/app.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHello(): Promise<string> {
    // simple test: count drivers (will be 0 until we seed)
    const driverCount = await this.prisma.driver.count();
    return `Hello from Nest + Prisma! Drivers in DB: ${driverCount}`;
  }
}
