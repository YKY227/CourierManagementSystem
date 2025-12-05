// src/jobs/jobs.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.job.findMany({
      orderBy: { pickupDate: 'asc' },
      include: {
        currentDriver: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        currentDriver: true,
        stops: true,
        assignments: true,
      },
    });
  }
}
