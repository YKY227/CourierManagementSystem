// src/admin/admin.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // keep this
import { AssignJobDto } from './dto/assign-job.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Prisma, $Enums, JobStatus, JobStopType,DriverStatus, VehicleType, RegionCode } from '../../generated/prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MailService } from "../mail/mail.service";
import { CreateDriverDto } from "./dto/create-driver.dto";
import * as bcrypt from "bcrypt";
import * as fs from "fs/promises";
import * as path from "path";

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
  
  async getJobsPaged(opts: {
    status?: string;
    page: number;
    pageSize: number;
  }) {
    const { status, page, pageSize } = opts;

    const where = this.buildJobsWhere(status);

    const [total, jobs] = await this.prisma.$transaction([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          publicId: true,
          customerName: true,
          pickupRegion: true,
          pickupDate: true,
          pickupSlot: true,
          jobType: true,
          status: true,
          assignmentMode: true,
          currentDriverId: true,
          stopsCount: true,
          totalBillableWeightKg: true,
          createdAt: true,
        },
      }),
    ]);

    // ✅ Shape matches what frontend wants (JobSummary-like)
    const data = jobs.map((j) => ({
      id: j.id,
      publicId: j.publicId,
      customerName: j.customerName,
      pickupRegion: this.mapRegionToFrontend(j.pickupRegion),
      pickupDate: j.pickupDate ? j.pickupDate.toISOString() : null,
      pickupSlot: j.pickupSlot ?? "",
      jobType: this.mapJobTypeToFrontend(j.jobType),
      status: this.mapJobStatusToFrontend(j.status),
      assignmentMode: j.assignmentMode ? this.mapAssignmentModeToFrontend(j.assignmentMode) : undefined,
      driverId: j.currentDriverId ?? undefined,
      stopsCount: j.stopsCount ?? 0,
      totalBillableWeightKg: j.totalBillableWeightKg?.toString?.() ?? "0",
      createdAt: j.createdAt.toISOString(),
    }));

    return {
      page,
      pageSize,
      total,
      data,
    };
  }

  // ─────────────────────────────
  // Status mapping / filtering
  // ─────────────────────────────
  private buildJobsWhere(status?: string): Prisma.JobWhereInput {
    const s = (status ?? "").toLowerCase();

    // Backend enum uses pending_assign, frontend uses pending-assignment
    if (s === "pending") {
      return {
        status: { in: [JobStatus.booked, JobStatus.pending_assign] },
      };
    }

    if (s === "active") {
  return {
    status: {
      in: [
        JobStatus.assigned,
        JobStatus.out_for_pickup,
        JobStatus.in_transit,
      ],
    },
  };
}


    if (s === "completed") {
      return { status: JobStatus.completed };
    }

    // fallback: allow exact enum name (e.g. status=assigned)
    // if unknown, return all
    if (!s) return {};
    if (Object.values(JobStatus).includes(s as any)) return { status: s as any };

    return {};
  }

  // ─────────────────────────────
  // “DB enum” -> “frontend string”
  // ─────────────────────────────
  private mapJobStatusToFrontend(s: JobStatus) {
    switch (s) {
      case JobStatus.pending_assign:
        return "pending-assignment";
      case JobStatus.out_for_pickup:
        return "out-for-pickup";
      case JobStatus.in_transit:
        return "in-transit";
      default:
        return s as any; // booked/assigned/completed/failed/cancelled
    }
  }

  private mapJobTypeToFrontend(t: any) {
    return t === "ad_hoc" ? "ad-hoc" : "scheduled";
  }

  private mapAssignmentModeToFrontend(m: any) {
    return m; // auto/manual same
  }

  private mapRegionToFrontend(r: any) {
    if (r === "north_east") return "north-east";
    if (r === "island_wide") return "island-wide";
    return r;
  }

  
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

  // inside AdminService
async deleteJob(jobId: string) {
  // 1) get proof photos BEFORE deleting DB rows
  const photos = await this.prisma.proofPhoto.findMany({
    where: { jobId },
    select: { url: true },
  });

  // 2) best-effort delete files on disk
  for (const p of photos) {
    if (!p.url) continue;

    // p.url expected like "/uploads/proof-photos/xxx.jpg"
    const abs = path.join(process.cwd(), p.url.replace(/^\//, ""));
    await fs.unlink(abs).catch(() => {});
  }

  // 3) delete the job (DB cascades children)
  try {
    await this.prisma.job.delete({ where: { id: jobId } });
  } catch (e) {
    throw new NotFoundException("Job not found");
  }
}

// Bulk delete jobs by status (Developer Mode feature)
// DELETE /admin/jobs?status=pending
async bulkDeleteJobs(opts: { status?: string }) {
  const status = (opts.status ?? "").trim().toLowerCase();

  if (!status) {
    throw new BadRequestException("status query is required for bulk delete");
  }

  // reuse your existing filter builder (already in your file)
  const where = this.buildJobsWhere(status);

  // If where resolves to {} (unknown status), block it to avoid deleting everything
  if (!where || Object.keys(where).length === 0) {
    throw new BadRequestException(
      `Invalid/unsupported status "${opts.status}" for bulk delete`
    );
  }

  // 1) collect proof photo urls (so we can delete local files best-effort)
  const photos = await this.prisma.proofPhoto.findMany({
    where: { jobId: { in: (await this.prisma.job.findMany({ where, select: { id: true } })).map(j => j.id) } },
    select: { url: true },
  });

  for (const p of photos) {
    if (!p.url) continue;
    const abs = path.join(process.cwd(), p.url.replace(/^\//, ""));
    await fs.unlink(abs).catch(() => {});
  }

  // 2) delete matching jobs (DB cascade removes stops/photos rows if relations are onDelete: Cascade)
  await this.prisma.job.deleteMany({ where });

  return { ok: true };
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
  const rows = await this.prisma.driver.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true, // ✅ MUST INCLUDE THIS
      name: true,
      email: true,
      phone: true,
      vehicleType: true,
      vehiclePlate: true,
      primaryRegion: true,
      secondaryRegions: true,
      maxJobsPerDay: true,
      maxJobsPerSlot: true,
      workDayStartHour: true,
      workDayEndHour: true,
      isActive: true,
      currentStatus: true,
      lastSeenAt: true,
      assignedJobCountToday: true,
      locationLat: true,
      locationLng: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map((d) => ({
    ...d,
    location:
      d.locationLat != null && d.locationLng != null
        ? { lat: d.locationLat, lng: d.locationLng }
        : null,
  }));
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

  async createDriver(dto: CreateDriverDto) {
  const code = dto.code.trim().toUpperCase();

  // email unique if provided
  if (dto.email) {
    const existsEmail = await this.prisma.driver.findFirst({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existsEmail) throw new BadRequestException("Driver email already exists");
  }

  // code unique (better message than raw prisma error)
  const existsCode = await this.prisma.driver.findFirst({
    where: { code },
    select: { id: true },
  });
  if (existsCode) throw new BadRequestException("Driver code already exists");

  const driver = await this.prisma.driver.create({
    data: {
      code,
      name: dto.name,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      vehicleType: dto.vehicleType,
      vehiclePlate: dto.vehiclePlate ?? null,
      primaryRegion: dto.primaryRegion,
      secondaryRegions: dto.secondaryRegions ?? [],
      isActive: dto.isActive ?? true,
      maxJobsPerDay: dto.maxJobsPerDay ?? 20,
      maxJobsPerSlot: dto.maxJobsPerSlot ?? 6,
      workDayStartHour: dto.workDayStartHour ?? 8,
      workDayEndHour: dto.workDayEndHour ?? 18,
      notes: dto.notes ?? null,
      currentStatus: DriverStatus.offline,
    },
  });

  return this.mapDriverToApi(driver);
}

async setDriverPin(driverId: string, pin: string) {
  const p = String(pin ?? "").trim();

  if (!/^\d{6}$/.test(p)) {
    throw new BadRequestException("PIN must be exactly 6 digits");
  }

  const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new NotFoundException("Driver not found");

  const pinHash = await bcrypt.hash(p, 10);

  await this.prisma.driver.update({
    where: { id: driverId },
    data: { pinHash },
  });

  return { ok: true };
}

async resetDriverPin(driverId: string, pin: string) {
  // same behavior as set — keep it separate for logging/auditing later
  return this.setDriverPin(driverId, pin);
}

async deleteDriver(id: string) {
  // prevent deletion if driver is currentDriver for any non-completed jobs
  const activeJobs = await this.prisma.job.count({
    where: {
      currentDriverId: id,
      status: { notIn: ["completed", "cancelled", "failed"] as any },
    },
  });

  if (activeJobs > 0) {
    throw new BadRequestException("Driver has active jobs. Unassign jobs before deletion.");
  }

  // mark old assignments inactive (cleanup)
  await this.prisma.jobAssignment.updateMany({
    where: { driverId: id, isActive: true },
    data: { isActive: false },
  });

  await this.prisma.driver.delete({ where: { id } });
  return { ok: true };
}

  async updateDriver(id: string, dto: UpdateDriverDto) {
  const existing = await this.prisma.driver.findUnique({ where: { id } });
  if (!existing) throw new NotFoundException("Driver not found");

  // Basic sanity
  if (dto.workDayStartHour != null && dto.workDayEndHour != null) {
    if (dto.workDayStartHour >= dto.workDayEndHour) {
      throw new BadRequestException("workDayStartHour must be < workDayEndHour");
    }
  }

  const data: Prisma.DriverUpdateInput = {
    ...(dto.code !== undefined ? { code: dto.code?.trim().toUpperCase() } : {}),
    ...(dto.name !== undefined ? { name: dto.name } : {}),
    ...(dto.email !== undefined ? { email: dto.email } : {}),
    ...(dto.phone !== undefined ? { phone: dto.phone } : {}),

    ...(dto.vehicleType !== undefined ? { vehicleType: dto.vehicleType as VehicleType } : {}),
    ...(dto.vehiclePlate !== undefined ? { vehiclePlate: dto.vehiclePlate } : {}),

    ...(dto.primaryRegion !== undefined ? { primaryRegion: dto.primaryRegion as RegionCode } : {}),
    ...(dto.secondaryRegions !== undefined ? { secondaryRegions: dto.secondaryRegions as RegionCode[] } : {}),

    ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    ...(dto.maxJobsPerDay !== undefined ? { maxJobsPerDay: dto.maxJobsPerDay } : {}),
    ...(dto.maxJobsPerSlot !== undefined ? { maxJobsPerSlot: dto.maxJobsPerSlot } : {}),
    ...(dto.workDayStartHour !== undefined ? { workDayStartHour: dto.workDayStartHour } : {}),
    ...(dto.workDayEndHour !== undefined ? { workDayEndHour: dto.workDayEndHour } : {}),
    ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
  };

  return this.prisma.driver.update({
    where: { id },
    data,
  });
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
    const stopsCount = dto.stops?.length ?? 0;

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
          stopsCount,
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

    async markPaymentSuccess(jobIdentifier: string) {
    // Accept BOTH internal id or publicId
    const job = await this.prisma.job.findFirst({
      where: {
        OR: [{ id: jobIdentifier }, { publicId: jobIdentifier }],
      },
      include: {
        stops: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobIdentifier} not found`);
    }

    if (job.paymentStatus === "PAID") {
      return job;
    }

    const updated = await this.prisma.job.update({
      where: { id: job.id }, // always use internal id for update
      data: {
        paymentStatus: "PAID",
        paymentConfirmedAt: new Date(),
      },
      include: {
        stops: true,
      },
    });

    // 3. Send emails (we already fixed types earlier)
    try {
      const deliveryCount = updated.stops.filter(
        (s) => s.type === JobStopType.DROPOFF
      ).length;

      const trackingUrl = `${
        process.env.PUBLIC_APP_URL ?? "https://yourdomain.com"
      }/tracking/${updated.publicId}`;

      const pickupDateStr = updated.pickupDate
        ? updated.pickupDate instanceof Date
          ? updated.pickupDate.toISOString().slice(0, 10)
          : String(updated.pickupDate)
        : "N/A";

      const pickupSlotStr = updated.pickupSlot ?? "N/A";

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

      await this.mailService.sendBookingPaidAdminEmail({
        jobId: updated.publicId ?? updated.id,
        pickupDate: pickupDateStr,
        pickupSlot: pickupSlotStr,
        deliveryCount,
        trackingUrl,
        customerName: updated.customerName,
        customerEmail: updated.customerEmail,
        customerPhone: updated.customerPhone,
        pickupRegion: updated.pickupRegion,
        serviceType: updated.serviceType,
        routeType: updated.routeType,
        jobType: updated.jobType,
      });

    } catch (err) {
      // swallow; logged inside MailService
    }

    return updated;
  }
}

