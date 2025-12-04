// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client'; // note the relative path

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    console.log('[Prisma] Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('[Prisma] Disconnected from database');
  }
}
