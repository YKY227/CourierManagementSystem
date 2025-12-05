import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toJobSummary } from '../../common/transformers/job.transformer';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const jobs = await this.prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map(toJobSummary);
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) throw new Error('Job not found');

    return toJobSummary(job);
  }
}
