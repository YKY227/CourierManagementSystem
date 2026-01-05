// courier-system-backend/src/modules/jobs/jobs.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, JobStopType, RegionCode } from "../../../generated/prisma/client";
import { toJobSummary } from "../../common/transformers/job.transformer";
import { CreateBookingDto } from "../../admin/dto/create-booking.dto";


function genPublicId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `STL-${yy}${mm}${dd}-${rand}`;
}

function toPickupDate(dateStr?: string | null) {
  // Expect "YYYY-MM-DD" from the wizard. Convert to DateTime (SGT midnight).
  // If it's already ISO, Date() still works.
  if (!dateStr) return null;

  // If it's exactly YYYY-MM-DD, make it explicit in +08:00.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T00:00:00+08:00`);
  }

  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDecimalKg(value: any) {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  // Prisma Decimal: keep 2dp like your schema @db.Decimal(10,2)
  return new Prisma.Decimal(n.toFixed(2));
}

function stopTypeToEnum(type: string): JobStopType {
  // Frontend sends "pickup" / "delivery"
  return type === "pickup" ? JobStopType.PICKUP : JobStopType.DROPOFF;
}

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

  async createFromBooking(dto: CreateBookingDto) {
    if (!dto?.customerName) throw new Error("customerName is required");
    if (!dto?.pickupRegion) throw new Error("pickupRegion is required");
    if (!dto?.jobType) throw new Error("jobType is required");
    if (!dto?.stops?.length) throw new Error("stops is required");

    const pickupStops = dto.stops.filter((s) => s.type === "pickup");
    const deliveryStops = dto.stops.filter((s) => s.type === "delivery");

    if (pickupStops.length < 1) throw new Error("At least 1 pickup stop required");
    if (deliveryStops.length < 1) throw new Error("At least 1 delivery stop required");

    // For now keep pickupDetails/deliveryPoints snapshots for UI reuse
    // even when many pickups exists (pickupDetails stores "primary pickup").
    const primaryPickup = pickupStops[0];

    const pickupDetailsSnapshot = {
      companyName: primaryPickup?.label ?? null,
      contactName: primaryPickup?.contactName ?? null,
      contactPhone: primaryPickup?.contactPhone ?? null,
      addressLine1: primaryPickup?.addressLine ?? null,
      addressLine2: null,
      postalCode: primaryPickup?.postalCode ?? null,
      region: primaryPickup?.region ?? dto.pickupRegion,
    };

    const deliveryPointsSnapshot = deliveryStops.map((s) => ({
      contactName: s.contactName ?? null,
      contactPhone: s.contactPhone ?? null,
      contactEmail: null,
      addressLine1: s.addressLine ?? null,
      addressLine2: null,
      postalCode: s.postalCode ?? null,
      remarks: null,
      saveAsFavorite: false,
    }));

    const created = await this.prisma.job.create({
      data: {
        publicId: genPublicId(),

        customerName: dto.customerName,
        customerEmail: dto.customerEmail ?? null,
        customerPhone: dto.customerPhone ?? null,

        serviceType: dto.serviceType ?? null,
        routeType: dto.routeType ?? null,

        pickupRegion: dto.pickupRegion as RegionCode,
        pickupDate: toPickupDate(dto.pickupDate),
        pickupSlot: dto.pickupSlot ?? null,

        stopsCount: dto.stops.length,
        totalBillableWeightKg: toDecimalKg(dto.totalBillableWeightKg),

        jobType: dto.jobType,
        // status defaults to booked (per schema)
        assignmentMode: dto.assignmentMode ?? null,
        source: dto.source ?? "web",

        // JSON snapshots for now (super useful for prototype UI)
        pickupDetails: (dto as any).pickupDetails ?? pickupDetailsSnapshot,
        deliveryPoints: (dto as any).deliveryPoints ?? deliveryPointsSnapshot,
        items: (dto as any).items ?? null,
        scheduleInfo: (dto as any).scheduleInfo ?? {
          pickupDate: dto.pickupDate ?? null,
          pickupSlot: dto.pickupSlot ?? null,
        },

        // Optional pricing snapshot if you choose to send it from frontend
        quotedPriceCents: (dto as any).quotedPriceCents ?? null,
        pricingBreakdown: (dto as any).pricingBreakdown ?? null,

        // ✅ Create all stops (supports many pickups now)
        stops: {
          create: dto.stops.map((s, idx) => ({
            sequenceIndex: idx,
            type: stopTypeToEnum(s.type),
            label: s.label ?? (s.type === "pickup" ? "Pickup" : "Dropoff"),
            addressLine: s.addressLine,
            postalCode: s.postalCode ?? null,
            region: s.region,
            contactName: s.contactName ?? null,
            contactPhone: s.contactPhone ?? null,
            latitude: s.latitude ?? null,
            longitude: s.longitude ?? null,
            notes: s.notes ?? null,
          })),
        },
      },
      include: {
        stops: true,
      },
    });

    return created;
  }

}
