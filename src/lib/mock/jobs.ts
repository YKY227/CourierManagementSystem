// src/lib/mock/jobs.ts
import type { JobSummary } from "@/lib/types";

/**
 * NOTE:
 * - `driverId` matches your mockDrivers: drv-1 (Alex), drv-2 (Siti), drv-3 (Kumar)
 * - Dates here are static; your unified-jobs-store already bumps some to "today"
 *   by overriding pickupDate for the first few jobs.
 */
export const mockJobs: JobSummary[] = [
  // ─────────────────────────────────────────────
  // Alex – Central / CBD morning route
  // ─────────────────────────────────────────────
  {
    id: "job-1",
    publicId: "STL-250323-1001",
    customerName: "GreenTech Pte Ltd",
    pickupRegion: "central",
    pickupDate: "2025-12-01",
    pickupSlot: "09:00 – 12:00",
    jobType: "scheduled",
    status: "assigned",
    assignmentMode: "auto",
    driverId: "drv-1", // Alex
    stopsCount: 4,
    totalBillableWeightKg: 32.5,
    createdAt: "2025-03-24T10:15:00Z",
  },

  // ─────────────────────────────────────────────
  // Siti – East mid-day SME deliveries
  // ─────────────────────────────────────────────
  {
    id: "job-2",
    publicId: "STL-250323-1002",
    customerName: "EduLink Solutions",
    pickupRegion: "east",
    pickupDate: "2025-03-25",
    pickupSlot: "12:00 – 15:00",
    jobType: "scheduled",
    status: "assigned",
    assignmentMode: "auto",
    driverId: "drv-2", // Siti
    stopsCount: 2,
    totalBillableWeightKg: 8.2,
    createdAt: "2025-03-24T11:05:00Z",
  },

  // ─────────────────────────────────────────────
  // Kumar – West late-afternoon bulk equipment
  // ─────────────────────────────────────────────
  {
    id: "job-3",
    publicId: "STL-250323-1003",
    customerName: "Sunrise Clinic",
    pickupRegion: "west",
    pickupDate: "2025-03-25",
    pickupSlot: "15:00 – 18:00",
    jobType: "scheduled",
    status: "assigned",
    assignmentMode: "manual", // maybe manually given to Kumar
    driverId: "drv-3", // Kumar
    stopsCount: 3,
    totalBillableWeightKg: 21.4,
    createdAt: "2025-03-24T12:30:00Z",
  },

  // ─────────────────────────────────────────────
  // Unassigned ad-hoc ASAP job (dispatcher demo)
  // ─────────────────────────────────────────────
  {
    id: "job-4",
    publicId: "STL-250323-1004",
    customerName: "Quick Print Services",
    pickupRegion: "central",
    pickupDate: "2025-03-25",
    pickupSlot: "ASAP (within 3h)",
    jobType: "ad-hoc",
    status: "pending-assignment",
    assignmentMode: undefined,
    driverId: null, // not yet assigned – good for assignment demo
    stopsCount: 1,
    totalBillableWeightKg: 1.2,
    createdAt: "2025-03-25T03:20:00Z",
  },

  // ─────────────────────────────────────────────
  // Yesterday – completed job for Siti
  // ─────────────────────────────────────────────
  {
    id: "job-5",
    publicId: "STL-240323-0999",
    customerName: "TechHub Co-working",
    pickupRegion: "east",
    pickupDate: "2025-03-24",
    pickupSlot: "09:00 – 12:00",
    jobType: "scheduled",
    status: "completed",
    assignmentMode: "auto",
    driverId: "drv-2", // Siti
    stopsCount: 5,
    totalBillableWeightKg: 45.0,
    createdAt: "2025-03-23T09:45:00Z",
  },

  // ─────────────────────────────────────────────
  // Older completed job for Kumar (history tab)
  // ─────────────────────────────────────────────
  {
    id: "job-6",
    publicId: "STL-230323-0990",
    customerName: "Industrial Supplies SG",
    pickupRegion: "west",
    pickupDate: "2025-03-23",
    pickupSlot: "13:00 – 16:00",
    jobType: "scheduled",
    status: "completed",
    assignmentMode: "manual",
    driverId: "drv-3", // Kumar
    stopsCount: 3,
    totalBillableWeightKg: 60.3,
    createdAt: "2025-03-22T15:10:00Z",
  },
];
