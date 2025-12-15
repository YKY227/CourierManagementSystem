import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { $Enums } from "../../generated/prisma/client";
import { UpdateDriverJobStatusDto } from "./dto/update-driver-job-status.dto";
import { MarkStopCompletedDto } from "./dto/mark-stop-completed.dto";

@Injectable()
export class DriverJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async listJobsForDriver(driverId: string) {
    if (!driverId) throw new BadRequestException("driverId is required");

    return this.prisma.job.findMany({
      where: { currentDriverId: driverId },
      orderBy: { pickupDate: "asc" },
      include: { currentDriver: true, stops: true as any },
    });
  }

  async updateJobStatus(jobId: string, dto: UpdateDriverJobStatusDto, driverId: string) {
    if (!driverId) throw new BadRequestException("driverId is required");

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException("Job not found");

    if (job.currentDriverId !== driverId) {
      throw new ForbiddenException("You are not assigned to this job");
    }

    let newStatus: $Enums.JobStatus;
    switch (dto.status) {
      case "pickup":
        newStatus = $Enums.JobStatus.out_for_pickup;
        break;
      case "in-progress":
        newStatus = $Enums.JobStatus.in_transit;
        break;
      case "completed":
        newStatus = $Enums.JobStatus.completed;
        break;
      case "booked":
        newStatus = $Enums.JobStatus.booked;
        break;
      default:
        newStatus = $Enums.JobStatus.assigned;
        break;
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: { status: newStatus, updatedAt: new Date() },
      include: { currentDriver: true, stops: true as any },
    });
  }

  async markStopCompleted(jobId: string, stopId: string, dto: MarkStopCompletedDto, driverId: string) {
    if (!driverId) throw new BadRequestException("driverId is required");

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException("Job not found");

    if (job.currentDriverId !== driverId) {
      throw new ForbiddenException("You are not assigned to this job");
    }

    const stop = await this.prisma.jobStop.findFirst({ where: { id: stopId, jobId } });
    if (!stop) throw new NotFoundException("Stop not found for this job");

    await this.prisma.jobStop.update({
      where: { id: stop.id },
      data: {
        status: $Enums.JobStopStatus.COMPLETED,
        completedAt: new Date(),
        completedByDriverId: driverId,
        notes: dto.note ?? stop.notes,
        updatedAt: new Date(),
      },
    });

    return this.prisma.job.findUnique({
      where: { id: jobId },
      include: { currentDriver: true, stops: true as any },
    });
  }
}
