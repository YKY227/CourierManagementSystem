// src/prisma/prisma.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config(); // load .env so DATABASE_URL is available

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error(
        '[PrismaService] DATABASE_URL is not set. Check your .env file in courier-system-backend.',
      );
    }

    // Create a pg pool using your Supabase session pooler connection string
    const pool = new Pool({
      connectionString: url,
      // optional tuning for later:
      // max: 10,
      // idleTimeoutMillis: 30000,
    });

    const adapter = new PrismaPg(pool);

    // ✅ Prisma 7 expects a non-empty PrismaClientOptions, e.g. { adapter }
    super({
      adapter,
      // You can also enable logs while developing:
      // log: ['query', 'error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('[Prisma] Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('[Prisma] Disconnected from database');
  }
}
