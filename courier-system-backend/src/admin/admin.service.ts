// src/admin/admin.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // keep this
import { AssignJobDto } from './dto/assign-job.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Prisma, $Enums, JobStatus, JobStopType } from '../../generated/prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MailService } from "../mail/mail.service";

export interface AdminJobDetailResponse {
  job: {
    id: string;
    publicId: string;
    customerName: string;
    jobType: string;
    status: string;
    assignmentMode: string | null;
    pickupRegion: string;
    pickupDate: string;
    pickupSlot: string | null;
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

interface JobFilter {
  status?: string;
}

/**
 * Helper to normalize front-end status strings to Prisma JobStatus enum.
 * This lets you support both "out-for-pickup" and "out_for_pickup", etc.
 */
function normalizeStatus(input?: string): JobStatus | undefined {
  if (!input) return undefined;
  const s = input.toLowerCase();

  switch (s) {
    case 'pending_assign':
    case 'pending-assignment':
      return 'pending_assign';

    case 'assigned':
      return 'assigned';

    case 'out_for_pickup':
    case 'out-for-pickup':
      return 'out_for_pickup';

    case 'in_transit':
    case 'in-transit':
      return 'in_transit';

    case 'completed':
      return 'completed';

    case 'cancelled':
      return 'cancelled';

    default:
      return undefined;
  }
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService,private readonly mailService: MailService) {}
  

  private mapStopTypeToPrisma(
  type: "pickup" | "delivery" | "return"
): $Enums.JobStopType {
  switch (type) {
    case "pickup":
      return $Enums.JobStopType.PICKUP;
    case "delivery":
      return $Enums.JobStopType.DROPOFF;
    case "return":
      return $Enums.JobStopType.RETURN;
    default:
      throw new BadRequestException(`Invalid stop type: ${type}`);
  }
}




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

   // Small helper to generate a public-facing ID like STL-20251208-1234
  private generatePublicId(pickupDate: Date): string {
    const y = pickupDate.getFullYear();
    const m = String(pickupDate.getMonth() + 1).padStart(2, '0');
    const d = String(pickupDate.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `STL-${y}${m}${d}-${rand}`;
  }

  // ─────────────────────────────────────────────
  // Jobs list WITH optional status filter
  // ─────────────────────────────────────────────
  async getJobs(filter: JobFilter = {}) {
    const where: Prisma.JobWhereInput = {};

    const normalized = normalizeStatus(filter.status);
    if (normalized) {
      where.status = normalized;
    }

    return this.prisma.job.findMany({
      where,
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
  // Assign job to driver
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

  async getPublicTrackingByPublicId(
  publicId: string,
  ): Promise<AdminJobDetailResponse> {
    // First find job by publicId (this is what customers know, e.g. "STL-241123-0999")
    const job = await this.prisma.job.findUnique({
      where: { publicId },
      select: { id: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Reuse your existing detailed mapper (includes stops + proofPhotos)
    return this.getJobDetail(job.id);
  }

  // ─────────────────────────────────────────────
  // NEW: create job from public booking
  // ─────────────────────────────────────────────
  async createJobFromBooking(dto: CreateBookingDto) {
    const pickupDate = new Date(dto.pickupDate);
    const publicId = this.generatePublicId(pickupDate);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Job
      const job = await tx.job.create({
        data: {
          publicId,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail ?? null,
          customerPhone: dto.customerPhone ?? null,
          serviceType: dto.serviceType ?? null,
          routeType: dto.routeType ?? null,
          pickupRegion: dto.pickupRegion,
          pickupDate,
          pickupSlot: dto.pickupSlot,
          jobType: dto.jobType,
          status: JobStatus.booked,
          assignmentMode: null,
          totalBillableWeightKg:
            dto.totalBillableWeightKg != null
              ? dto.totalBillableWeightKg
              : 0,
          source: 'public-booking',
        },
      });

      // 2. Optionally create stops
      if (dto.stops && dto.stops.length > 0) {
        await tx.jobStop.createMany({
          data: dto.stops.map((s, index) => ({
            jobId: job.id,
            sequenceIndex: index,
            // Map "pickup" | "delivery" | "return" → Prisma enum
            type: this.mapStopTypeToPrisma(s.type),
            label: s.label,
            addressLine: s.addressLine,
            postalCode: s.postalCode ?? "",
            region: s.region as any, // if RegionCode is also uppercase you can clean this later
            contactName: s.contactName ?? "",
            contactPhone: s.contactPhone ?? "",
            status: $Enums.JobStopStatus.PENDING,
          })),
        });
      }


      // You *could* auto-assign a driver here later by calling this.autoAssignJob(job.id)

      // 3. Return job with stops so frontend gets ID + publicId
      const created = await tx.job.findUnique({
        where: { id: job.id },
        include: { stops: true },
      });

      return created;
    });
  }

    async markPaymentSuccess(jobId: string) {
    // 1. Load job with stops and customer contact
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        stops: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    // If already paid, we can just return silently (idempotent)
    if (job.paymentStatus === "PAID") {
      return job;
    }

    // 2. Update payment status
    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        paymentStatus: "PAID",
        paymentConfirmedAt: new Date(),
      },
      include: {
        stops: true,
      },
    });

    // 3. Send emails (fire and forget – don't block the whole request if email fails)
    try {
      const deliveryCount = updated.stops.filter(
      (s) => s.type === JobStopType.DROPOFF
      ).length;

      const trackingUrl = `${process.env.PUBLIC_APP_URL ?? "https://yourdomain.com"}/tracking/${updated.publicId}`;

      // Format pickupDate into a YYYY-MM-DD string (or fallback)
      const pickupDateStr = updated.pickupDate
      ? updated.pickupDate instanceof Date
      ? updated.pickupDate.toISOString().slice(0, 10) // "2025-12-11"
      : String(updated.pickupDate)
      : "N/A";

      const pickupSlotStr = updated.pickupSlot ?? "N/A";


      // Customer email only if we have email
      if (updated.customerEmail) {
        await this.mailService.sendBookingPaidCustomerEmail({
          to: updated.customerEmail,
          jobId: updated.publicId ?? updated.id,
          pickupDate: pickupDateStr,
      pickupSlot: pickupSlotStr,
          deliveryCount,
          trackingUrl,
        });
      }

      // Admin / dispatch notification
      await this.mailService.sendBookingPaidAdminEmail({
        jobId: updated.publicId ?? updated.id,
        pickupDate: pickupDateStr,
      pickupSlot: pickupSlotStr,
        deliveryCount,
        trackingUrl,
      });
    } catch (err) {
      // We already logged inside MailService; here we just swallow
      // so that the payment endpoint still returns success.
    }

    return updated;
  }

}
