// prisma/mock/jobs.seed.ts

// Local type definitions (optional, only for seeding clarity)
export type SeedJobStatus =
  | "booked"
  | "pending-assignment"
  | "assigned"
  | "out-for-pickup"
  | "in-transit"
  | "completed"
  | "failed"
  | "cancelled";

export type SeedAssignmentMode = "auto" | "manual" | null;

export type SeedJob = {
  id: string;
  publicId: string;
  customerName: string;
  pickupRegion:
    | "central"
    | "east"
    | "west"
    | "north"
    | "north-east"
    | "island-wide";
  pickupDate: string; // YYYY-MM-DD
  pickupSlot: string | null; // "09:00 – 12:00"
  jobType: "scheduled" | "ad-hoc";
  status: SeedJobStatus;
  assignmentMode: SeedAssignmentMode;
  driverId: string | null;
  stopsCount: number;
  totalBillableWeightKg: number;
  createdAt: string; // ISO date string
};

export const mockJobs: SeedJob[] = [
  // ────────────────────────────────────────────
  // Alex (drv-1) – ONE pickup → MANY deliveries
  // ────────────────────────────────────────────
  {
    id: "job-1",
    publicId: "STL-251123-1023",
    customerName: "Tech Hygiene Hub",
    pickupRegion: "central",
    pickupDate: "2025-12-02",
    pickupSlot: "09:00 – 12:00",
    jobType: "scheduled",
    status: "out-for-pickup",
    assignmentMode: "auto",
    driverId: "drv-1",
    stopsCount: 4,
    totalBillableWeightKg: 18.4,
    createdAt: "2025-11-24T10:15:00Z",
  },

  // ────────────────────────────────────────────
  // Siti (drv-2) – MANY pickups → ONE delivery
  // ────────────────────────────────────────────
  {
    id: "job-2",
    publicId: "STL-261123-2045",
    customerName: "Cleanroom Logistics",
    pickupRegion: "east",
    pickupDate: "2025-11-25",
    pickupSlot: "12:00 – 15:00",
    jobType: "scheduled",
    status: "assigned",
    assignmentMode: "auto",
    driverId: "drv-2",
    stopsCount: 4,
    totalBillableWeightKg: 12.6,
    createdAt: "2025-11-24T11:05:00Z",
  },

  // ────────────────────────────────────────────
  // Kumar (drv-3) – ROUND TRIP
  // ────────────────────────────────────────────
  {
    id: "job-3",
    publicId: "STL-271123-3131",
    customerName: "Warehouse Hub",
    pickupRegion: "west",
    pickupDate: "2025-11-25",
    pickupSlot: "15:00 – 18:00",
    jobType: "scheduled",
    status: "booked",
    assignmentMode: "manual",
    driverId: "drv-3",
    stopsCount: 4,
    totalBillableWeightKg: 32.0,
    createdAt: "2025-11-24T12:30:00Z",
  },

  // ────────────────────────────────────────────
  // Completed job 1
  // ────────────────────────────────────────────
  {
    id: "job-4",
    publicId: "STL-241123-0999",
    customerName: "TechHub Co-working",
    pickupRegion: "central",
    pickupDate: "2025-11-24",
    pickupSlot: "09:00 – 12:00",
    jobType: "scheduled",
    status: "completed",
    assignmentMode: "manual",
    driverId: "drv-1",
    stopsCount: 3,
    totalBillableWeightKg: 10.2,
    createdAt: "2025-11-23T09:45:00Z",
  },

  // ────────────────────────────────────────────
  // Completed job 2
  // ────────────────────────────────────────────
  {
    id: "job-5",
    publicId: "STL-231123-0998",
    customerName: "EduLink Solutions",
    pickupRegion: "north-east",
    pickupDate: "2025-11-23",
    pickupSlot: "12:00 – 15:00",
    jobType: "scheduled",
    status: "completed",
    assignmentMode: "auto",
    driverId: "drv-2",
    stopsCount: 2,
    totalBillableWeightKg: 7.3,
    createdAt: "2025-11-22T11:00:00Z",
  },
];
