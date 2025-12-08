// src/admin/admin.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // keep this
import { AssignJobDto } from './dto/assign-job.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Prisma, $Enums } from '../../generated/prisma/client';

export interface AdminJobDetailResponse {
  job: {
    id: string;
    publicId: string;
    customerName: string;
    jobType: string;
    status: string;
    assignmentMode: string| null;
    pickupRegion: string;
    pickupDate: string;
    pickupSlot: string| null;
    stopsCount: number;
    totalBillableWeightKg: string | number;
    driverId: string | null;
    createdAt: string;
    driverName?: string | null;
    driverPhone?: string | null;
  };
  stops: {
    id: string;
    sequenceIndex: number;
    type: string;               // "pickup" | "delivery" | "return"
    label: string;
    addressLine: string;
    postalCode: string | null;
    region: string;
    contactName: string | null;
    contactPhone: string | null;
    status: string;             // "pending" | "completed" etc
    completedAt: string | null;
  }[];
  proofPhotos: {
    id: string;
    jobId: string;
    stopId: string | null;
    url: string;
    takenAt: string;
  }[];
}


@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔹 Map Prisma Driver → API Driver (matches frontend Driver type)
  private mapDriverToApi(d: any) {
    return {
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      vehicleType: d.vehicleType,
      vehiclePlate: d.vehiclePlate,
      primaryRegion: d.primaryRegion,
      secondaryRegions: d.secondaryRegions ?? [],

      maxJobsPerDay: d.maxJobsPerDay,
      maxJobsPerSlot: d.maxJobsPerSlot,
      workDayStartHour: d.workDayStartHour,
      workDayEndHour: d.workDayEndHour,

      isActive: d.isActive,
      currentStatus: d.currentStatus,
      lastSeenAt: d.lastSeenAt,
      assignedJobCountToday: d.assignedJobCountToday ?? 0,

      // Frontend expects `location: {lat, lng} | null`
      location:
        d.locationLat != null && d.locationLng != null
          ? { lat: d.locationLat, lng: d.locationLng }
          : null,

      notes: d.notes,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  // ─────────────────────────────────────────────
  // Existing methods (example)
  // ─────────────────────────────────────────────
  async getJobs() {
    return this.prisma.job.findMany({
      include: {
        currentDriver: true,
        stops: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getJobById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        currentDriver: true,
        stops: true,
        assignments: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  /**
   * Auto-assign a job to a driver (very simple prototype logic).
   * Later you can replace the selection logic with a richer scoring engine.
   */
  async autoAssignJob(jobId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Load job
      const job = await tx.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      if (job.status === 'completed' || job.status === 'cancelled') {
        throw new BadRequestException('Cannot auto-assign a completed/cancelled job');
      }

      // 2. Load available drivers (simple: active + region match OR global)
      const drivers = await tx.driver.findMany({
        where: {
          isActive: true,
        },
      });

      if (drivers.length === 0) {
        throw new BadRequestException('No active drivers available');
      }

      // Very basic selection:
      //   1) same primaryRegion as job.pickupRegion first
      //   2) fallback to first active driver
      const sameRegion = drivers.filter(
        (d) => d.primaryRegion === job.pickupRegion,
      );

      const chosenDriver = sameRegion[0] ?? drivers[0];

      // 3. Reuse your existing assignment logic
      //    (this assumes you already have assignJob(jobId, dto) method)
      const updatedJob = await this.assignJob(jobId, {
        driverId: chosenDriver.id,
        mode: $Enums.AssignmentMode.auto,
      });

      return updatedJob;
    });
  }

  // ─────────────────────────────────────────────
  // NEW: Assign job to driver
  // ─────────────────────────────────────────────
  async assignJob(jobId: string, dto: AssignJobDto) {
    const { driverId, mode } = dto; // mode: 'auto' | 'manual'

    return this.prisma.$transaction(async (tx) => {
      // 1. Ensure job exists
      const job = await tx.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new NotFoundException('Job not found');
      }

      // 2. Ensure driver exists
      const driver = await tx.driver.findUnique({
        where: { id: driverId },
      });

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      // 3. Deactivate existing active assignments
      await tx.jobAssignment.updateMany({
        where: { jobId, isActive: true },
        data: { isActive: false },
      });

      // 4. Create new JobAssignment
      await tx.jobAssignment.create({
        data: {
          jobId,
          driverId,
          mode: mode as any, // enum column, we pass 'auto' | 'manual'
          isActive: true,
        },
      });

      // 5. Update Job
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: 'assigned' as any,
          assignmentMode: mode as any,
          currentDriverId: driverId,
          assignmentFailureReason: null,
        },
      });

      return updatedJob;
    });
  }

  async listDrivers() {
    const drivers = await this.prisma.driver.findMany({
      orderBy: { name: 'asc' },
    });
    return drivers.map((d) => this.mapDriverToApi(d));
  }

  async getDriverById(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return this.mapDriverToApi(driver);
  }

  async updateDriver(id: string, dto: UpdateDriverDto) {
    const driver = await this.prisma.driver.update({
      where: { id },
      data: {
        // simple pass-through — DTO properties match columns
        isActive: dto.isActive,
        currentStatus: dto.currentStatus,
        maxJobsPerDay: dto.maxJobsPerDay,
        maxJobsPerSlot: dto.maxJobsPerSlot,
        workDayStartHour: dto.workDayStartHour,
        workDayEndHour: dto.workDayEndHour,
        primaryRegion: dto.primaryRegion,
        secondaryRegions: dto.secondaryRegions,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        notes: dto.notes,
      },
    });

    return this.mapDriverToApi(driver);
  }

  async getJobDetail(jobId: string): Promise<AdminJobDetailResponse> {
  const job = await this.prisma.job.findUnique({
    where: { id: jobId },
    include: {
      currentDriver: true,
      stops: true,
      proofPhotos: true,
    },
  });

  if (!job) {
    throw new NotFoundException('Job not found');
  }

  // Map Job -> "JobSummary + driverName/phone" like the frontend expects
  const totalWeight =
    typeof job.totalBillableWeightKg === 'number'
      ? job.totalBillableWeightKg
      : Number(job.totalBillableWeightKg ?? 0);

  const jobDto: AdminJobDetailResponse['job'] = {
    id: job.id,
    publicId: job.publicId,
    customerName: job.customerName,
    jobType: job.jobType,
    status: job.status,
    assignmentMode: job.assignmentMode,
    pickupRegion: job.pickupRegion,
    // If pickupDate is Date in DB, convert to yyyy-mm-dd string
    pickupDate:
      job.pickupDate instanceof Date
        ? job.pickupDate.toISOString().slice(0, 10)
        : (job.pickupDate as any),
    pickupSlot: job.pickupSlot,
    stopsCount: job.stopsCount,
    totalBillableWeightKg: totalWeight,
    driverId: job.currentDriverId ?? null,
    createdAt:
      job.createdAt instanceof Date
        ? job.createdAt.toISOString()
        : (job.createdAt as any),
    driverName: job.currentDriver?.name ?? null,
    driverPhone: job.currentDriver?.phone ?? null,
  };

  const stops: AdminJobDetailResponse['stops'] = job.stops
    .slice()
    .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
    .map((stop) => ({
      id: stop.id,
      sequenceIndex: stop.sequenceIndex,
      type: stop.type, // Prisma enum value, serializes as string
      label: stop.label,
      addressLine: stop.addressLine,
      postalCode: stop.postalCode,
      region: stop.region,
      contactName: stop.contactName,
      contactPhone: stop.contactPhone,
      status: stop.status,
      completedAt: stop.completedAt
        ? stop.completedAt.toISOString()
        : null,
    }));

  const proofPhotos: AdminJobDetailResponse['proofPhotos'] = job.proofPhotos
    .slice()
    .sort((a, b) => a.takenAt.getTime() - b.takenAt.getTime())
    .map((photo) => ({
      id: photo.id,
      jobId: photo.jobId,
      stopId: photo.stopId ?? null,
      url: photo.url,
      takenAt: photo.takenAt.toISOString(),
    }));

  return {
    job: jobDto,
    stops,
    proofPhotos,
  };
}

}
