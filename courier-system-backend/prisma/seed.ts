// prisma/seed.ts
import {
  PrismaClient,
  Prisma,
  RegionCode,
  VehicleType,
  JobStatus,
  JobType,
  AssignmentMode,
  DriverStatus, 
} from '../generated/prisma/client';

import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Load env
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('[seed.ts] DATABASE_URL missing in backend .env');
}

// Create adapter
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);

// IMPORTANT: Prisma 7 requires { adapter }
const prisma = new PrismaClient({
  adapter,
});

// Use backend-local mock files
import { mockDrivers } from './mock/drivers.seed';
import { mockJobs } from './mock/jobs.seed';

// --- Mapping helpers ---
function mapRegion(region: string): RegionCode {
  switch (region) {
    case 'central': return RegionCode.central;
    case 'east': return RegionCode.east;
    case 'west': return RegionCode.west;
    case 'north': return RegionCode.north;
    case 'north-east':
    case 'north_east': return RegionCode.north_east;
    case 'island-wide':
    case 'island_wide': return RegionCode.island_wide;
    default:
      throw new Error(`Unknown region: ${region}`);
  }
}

function mapDriverStatus(status: string | null | undefined): DriverStatus {
  // Normalise to lowercase for comparison
  const s = (status ?? 'offline').toLowerCase();

  // We support both lowercase and UPPERCASE enum naming styles
  switch (s) {
    case 'online':
      return (DriverStatus as any).online ?? (DriverStatus as any).ONLINE;
    case 'break':
      return (DriverStatus as any).break ?? (DriverStatus as any).BREAK;
    case 'offline':
    default:
      return (DriverStatus as any).offline ?? (DriverStatus as any).OFFLINE ?? Object.values(DriverStatus)[0];
  }
}


function mapVehicleType(type: string): VehicleType {
  switch (type) {
    case 'bike': return VehicleType.bike;
    case 'car': return VehicleType.car;
    case 'van': return VehicleType.van;
    case 'lorry': return VehicleType.lorry;
    default: return VehicleType.car;
  }
}

function mapJobType(jobType: string): JobType {
  switch (jobType) {
    case 'scheduled': return JobType.scheduled;
    case 'ad-hoc':
    case 'ad_hoc': return JobType.ad_hoc;
    default: return JobType.scheduled;
  }
}

function mapJobStatus(status: string): JobStatus {
  switch (status) {
    case 'booked': return JobStatus.booked;
    case 'pending-assignment':
    case 'pending_assign': return JobStatus.pending_assign;
    case 'assigned': return JobStatus.assigned;
    case 'out-for-pickup':
    case 'out_for_pickup': return JobStatus.out_for_pickup;
    case 'in-progress':
    case 'in_transit':
    case 'in-transit': return JobStatus.in_transit;
    case 'completed': return JobStatus.completed;
    case 'failed': return JobStatus.failed;
    case 'cancelled': return JobStatus.cancelled;
    default: return JobStatus.booked;
  }
}

function mapAssignmentMode(mode: string | null): AssignmentMode | null {
  if (!mode) return null;
  return mode === 'auto' ? AssignmentMode.auto : AssignmentMode.manual;
}

// --- Seed Org Settings (singleton) ---
async function seedOrgSettings() {
  console.log('Seeding org settings…');

  await prisma.orgSettings.upsert({
    where: { id: 'singleton' },
    update: {
      // keep minimal updates so re-seeding doesn’t overwrite real data
    },
    create: {
      id: 'singleton',
      orgName: 'Courier Ops',
      supportEmail: 'support@example.com',

      adminNotificationEmails: [],
      bookingPaidRecipients: [],
      overdueRecipients: [],

      bccTesterEnabled: false,
      testerEmails: [],
    },
  });

  console.log('Org settings ready.');
}


// --- Seed Drivers ---
async function seedDrivers() {
  console.log('Seeding drivers…');

  for (const d of mockDrivers) {
    await prisma.driver.upsert({
      where: { id: d.id },
      update: {
        name: d.name,
        email: d.email ?? null,
        phone: d.phone ?? null,
        vehicleType: mapVehicleType(d.vehicleType),
        vehiclePlate: d.vehiclePlate ?? null,
        primaryRegion: mapRegion(d.primaryRegion),
        secondaryRegions: d.secondaryRegions?.map(mapRegion) ?? [],
        maxJobsPerDay: d.maxJobsPerDay ?? 12,
        maxJobsPerSlot: d.maxJobsPerSlot ?? 4,
        workDayStartHour: d.workDayStartHour ?? 8,
        workDayEndHour: d.workDayEndHour ?? 17,
        isActive: d.isActive ?? true,
        currentStatus: mapDriverStatus(d.currentStatus),

        lastSeenAt: d.lastSeenAt ? new Date(d.lastSeenAt) : null,
        locationLat: d.location?.lat ?? null,
        locationLng: d.location?.lng ?? null,
        notes: d.notes ?? null,
      },
      create: {
        id: d.id,
        name: d.name,
        email: d.email ?? null,
        phone: d.phone ?? null,
        vehicleType: mapVehicleType(d.vehicleType),
        vehiclePlate: d.vehiclePlate ?? null,
        primaryRegion: mapRegion(d.primaryRegion),
        secondaryRegions: d.secondaryRegions?.map(mapRegion) ?? [],
        maxJobsPerDay: d.maxJobsPerDay ?? 12,
        maxJobsPerSlot: d.maxJobsPerSlot ?? 4,
        workDayStartHour: d.workDayStartHour ?? 8,
        workDayEndHour: d.workDayEndHour ?? 17,
        isActive: d.isActive ?? true,
        currentStatus: mapDriverStatus(d.currentStatus),

        lastSeenAt: d.lastSeenAt ? new Date(d.lastSeenAt) : null,
        locationLat: d.location?.lat ?? null,
        locationLng: d.location?.lng ?? null,
        notes: d.notes ?? null,
      },
    });
  }

  console.log(`Seeded ${mockDrivers.length} drivers.`);
}

// --- Seed Jobs ---
async function seedJobs() {
  console.log('Seeding jobs…');

  for (const j of mockJobs) {
    const pickupDate = j.pickupDate ? new Date(j.pickupDate) : null;

    await prisma.job.upsert({
      where: { id: j.id },
      update: {
        publicId: j.publicId,
        customerName: j.customerName,
        customerEmail: null,
        customerPhone: null,
        pickupRegion: mapRegion(j.pickupRegion),
        pickupDate,
        pickupSlot: j.pickupSlot ?? null,
        stopsCount: j.stopsCount ?? 0,
        totalBillableWeightKg: j.totalBillableWeightKg
          ? new Prisma.Decimal(j.totalBillableWeightKg)
          : null,
        jobType: mapJobType(j.jobType),
        status: mapJobStatus(j.status),
        assignmentMode: mapAssignmentMode(j.assignmentMode),
        assignmentFailureReason: null,
        source: 'mock-seed',
        currentDriverId: j.driverId ?? null,
        createdAt: j.createdAt ? new Date(j.createdAt) : undefined,
      },
      create: {
        id: j.id,
        publicId: j.publicId,
        customerName: j.customerName,
        customerEmail: null,
        customerPhone: null,
        pickupRegion: mapRegion(j.pickupRegion),
        pickupDate,
        pickupSlot: j.pickupSlot ?? null,
        stopsCount: j.stopsCount ?? 0,
        totalBillableWeightKg: j.totalBillableWeightKg
          ? new Prisma.Decimal(j.totalBillableWeightKg)
          : null,
        jobType: mapJobType(j.jobType),
        status: mapJobStatus(j.status),
        assignmentMode: mapAssignmentMode(j.assignmentMode),
        assignmentFailureReason: null,
        source: 'mock-seed',
        currentDriverId: j.driverId ?? null,
        createdAt: j.createdAt ? new Date(j.createdAt) : undefined,
      },
    });
  }

  console.log(`Seeded ${mockJobs.length} jobs.`);
}

// --- Run seeds ---
async function main() {
  await seedOrgSettings(); 
  await seedDrivers();
  await seedJobs();
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
