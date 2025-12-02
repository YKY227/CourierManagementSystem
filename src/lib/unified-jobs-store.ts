// src/lib/unified-jobs-store.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Job,
  JobSummary,
  JobStatus,
  AssignmentMode,
  AssignmentConfig,
  RegionCode,
  Driver,
  DriverJob,          // 👈 add this
  DriverJobStatus,
  DriverJobStop,
  RoutePattern,          
} from "@/lib/types";

import { defaultAssignmentConfig } from "@/lib/types";
import { mockJobs } from "@/lib/mock/jobs";
import { mockDrivers } from "@/lib/mock/drivers";



import {
  scoreDriversForJob,
  pickBestDriver,
} from "@/lib/assignment";

// If you want to move auto-assign logic in here later, you can
// re-enable these imports and add the function.
// import type { AssignmentConfig } from "@/lib/types";
// import { defaultAssignmentConfig } from "@/lib/types";
// import { scoreDriversForJob, pickBestDriver } from "@/lib/assignment";

// ─────────────────────────────────────────────
// OFFLINE DRIVER ACTIONS
// ─────────────────────────────────────────────
export type PendingActionType = "job-status" | "stop-completed";

export interface PendingAction {
  id: string;
  type: PendingActionType;
  jobId: string;
  stopId?: string;
  newStatus?: DriverJobStatus;
  createdAt: string;
}

interface PersistedState {
  jobs: Job[];
  driverJobs: DriverJob[];
  drivers: Driver[];
  pendingActions: PendingAction[];
}

const STORAGE_KEY = "unified-jobs-state-v2";

// ─────────────────────────────────────────────
// Helpers: Mapping between admin + driver models
// ─────────────────────────────────────────────
function mapDriverStatusToJobStatus(status: DriverJobStatus): JobStatus {
  switch (status) {
    case "booked":
    case "allocated":
      return "assigned";
    case "pickup":
      return "out-for-pickup";
    case "in-progress":
      return "in-transit";
    case "completed":
      return "completed";
    default:
      return "assigned";
  }
}

function mapJobStatusToDriverStatus(status: JobStatus): DriverJobStatus {
  switch (status) {
    case "pending-assignment":
    case "assigned":
      return "allocated";
    case "out-for-pickup":
      return "pickup";
    case "in-transit":
      return "in-progress";
    case "completed":
      return "completed";
    default:
      return "allocated";
  }
}



function projectSummaryToDriverJob(summary: JobSummary): DriverJob {
  const areaLabelMap: Record<string, string> = {
    central: "Central / CBD",
    east: "East / Tampines",
    west: "West / Jurong",
    north: "North / Woodlands",
    "north-east": "North-East / Sengkang",
    "island-wide": "Island-wide",
  };

  let stops: DriverJobStop[] = [];
  let routePattern: RoutePattern = "one-to-one"; // safe default

  switch (summary.id) {
    // ────────────────────────────────────────
    // job-1: ONE pickup → MANY deliveries
    // ────────────────────────────────────────
    case "job-1":
      routePattern = "one-to-many";
      stops = [
        {
          id: "job-1-s1",
          type: "pickup",
          sequence: 1,
          label: "Pickup – Tech Hygiene Hub",
          addressLine1: "10 Dover Drive",
          postalCode: "138683",
          contactName: "Yong",
          contactPhone: "+65 9000 0001",
          remarks: "Laptop cleaning equipment – handle carefully.",
        },
        {
          id: "job-1-s2",
          type: "delivery",
          sequence: 2,
          label: "Delivery – ITE College Central",
          addressLine1: "2 Ang Mo Kio Drive",
          postalCode: "567720",
          contactName: "Operations Counter",
          contactPhone: "+65 9000 0002",
          remarks: "Report to security before unloading.",
        },
        {
          id: "job-1-s3",
          type: "delivery",
          sequence: 3,
          label: "Delivery – Client Office B",
          addressLine1: "1 Fusionopolis Way",
          postalCode: "138632",
          contactName: "IT Dept",
          contactPhone: "+65 9000 0003",
        },
        {
          id: "job-1-s4",
          type: "delivery",
          sequence: 4,
          label: "Delivery – Client Office C",
          addressLine1: "9 Jurong Town Hall Rd",
          postalCode: "609431",
          contactName: "Admin",
          contactPhone: "+65 9000 0004",
        },
      ];
      break;

    // ────────────────────────────────────────
    // job-2: MANY pickups → ONE delivery
    // ────────────────────────────────────────
    case "job-2":
      routePattern = "many-to-one";
      stops = [
        {
          id: "job-2-s1",
          type: "pickup",
          sequence: 1,
          label: "Pickup – Supplier A",
          addressLine1: "50 Jurong Gateway Road",
          postalCode: "608549",
          contactName: "Supervisor",
          contactPhone: "+65 9000 1000",
        },
        {
          id: "job-2-s2",
          type: "pickup",
          sequence: 2,
          label: "Pickup – Supplier B",
          addressLine1: "1 Pasir Ris Central",
          postalCode: "519599",
          contactName: "Store",
          contactPhone: "+65 9000 2000",
        },
        {
          id: "job-2-s3",
          type: "pickup",
          sequence: 3,
          label: "Pickup – Supplier C",
          addressLine1: "2 Tampines Central 5",
          postalCode: "529509",
          contactName: "Warehouse",
          contactPhone: "+65 9000 3000",
        },
        {
          id: "job-2-s4",
          type: "delivery",
          sequence: 4,
          label: "Delivery – Central Lab",
          addressLine1: "5 Science Park Drive",
          postalCode: "118260",
          contactName: "Lab Admin",
          contactPhone: "+65 9000 4000",
          remarks: "Deliver samples to cold room.",
        },
      ];
      break;

    // ────────────────────────────────────────
    // job-3: ROUND TRIP / SEQUENCE
    // ────────────────────────────────────────
    case "job-3":
      routePattern = "round-trip";
      stops = [
        {
          id: "job-3-s1",
          type: "pickup",
          sequence: 1,
          label: "Pickup – Warehouse Hub (A)",
          addressLine1: "3 International Business Park",
          postalCode: "609927",
          contactName: "Warehouse Supervisor",
          contactPhone: "+65 9000 5000",
          remarks: "Load pallets, secure with straps.",
        },
        {
          id: "job-3-s2",
          type: "delivery",
          sequence: 2,
          label: "Delivery / Collection – Customer B",
          addressLine1: "21 Bukit Batok Crescent",
          postalCode: "658065",
          contactName: "Ops Manager",
          contactPhone: "+65 9000 6000",
        },
        {
          id: "job-3-s3",
          type: "delivery",
          sequence: 3,
          label: "Delivery / Collection – Customer C",
          addressLine1: "18 Tuas Avenue 10",
          postalCode: "639142",
          contactName: "Loading Bay",
          contactPhone: "+65 9000 7000",
        },
        {
          id: "job-3-s4",
          type: "return",
          sequence: 4,
          label: "Return – Warehouse Hub (A)",
          addressLine1: "3 International Business Park",
          postalCode: "609927",
          contactName: "Warehouse Supervisor",
          contactPhone: "+65 9000 5000",
          remarks: "Return collected items to inbound bay.",
        },
      ];
      break;

    // Default: minimal 1-pickup template (for any future jobs)
    default:
      routePattern = "one-to-one";
      stops = [
        {
          id: `${summary.id}-s1`,
          type: "pickup",
          sequence: 1,
          label: `Pickup – ${summary.customerName}`,
          addressLine1: "TBC from booking",
          postalCode: "000000",
          contactName: "TBC",
          contactPhone: "+65 9999 9999",
        },
      ];
  }

  return {
    id: summary.id,
    displayId: summary.publicId,
    status: mapJobStatusToDriverStatus(summary.status),
    serviceType: "same-day",
    pickupDate: summary.pickupDate,
    pickupWindow: summary.pickupSlot,
    totalStops: stops.length,
    totalBillableWeightKg: summary.totalBillableWeightKg,
    originLabel: summary.customerName,
    areaLabel: areaLabelMap[summary.pickupRegion] ?? summary.pickupRegion,

    routePattern,                           // 👈 NEW
    driverId: summary.driverId ?? null,
    assignedDriverId: summary.driverId ?? null,

    stops,
  };
}



function bootstrapJobsFromSummaries(summaries: JobSummary[]): Job[] {
  const now = new Date().toISOString();
  return summaries.map((s) => ({
    id: s.id,
    publicId: s.publicId,
    source: "admin",
    jobType: s.jobType,
    status: s.status,
    assignmentMode: s.assignmentMode,
    serviceType: "same-day" as any,
    routeType: "point-to-point" as any,
    pickup: {} as any,
    deliveries: [],
    items: [],
    // NOTE: our real ScheduleInfo comes from booking-store later.
    // For now we just satisfy the type.
    schedule: {} as any,
    assignedDriver: s.driverId
      ? {
          driverId: s.driverId,
          name: "Driver",
          phone: "",
          vehicleType: "van" as any,
          primaryRegion: s.pickupRegion,
        }
      : undefined,
    createdAt: s.createdAt,
    updatedAt: now,
  }));
}

function projectJobToSummary(job: Job, fallback?: JobSummary): JobSummary {
  if (!fallback) {
    return {
      id: job.id,
      publicId: job.publicId,
      customerName: "Unknown",
      jobType: job.jobType,
      status: job.status,
      assignmentMode: job.assignmentMode,
      pickupRegion: "central",
      pickupDate: job.createdAt.slice(0, 10),
      pickupSlot: "TBC",
      stopsCount: 1,
      totalBillableWeightKg: 0,
      driverId: job.assignedDriver?.driverId ?? null,
      createdAt: job.createdAt,
    };
  }

  return {
    ...fallback,
    status: job.status,
    assignmentMode: job.assignmentMode,
    driverId: job.assignedDriver?.driverId ?? fallback.driverId ?? null,
  };
}

// ─────────────────────────────────────────────
// Unified Jobs Store
// ─────────────────────────────────────────────
export interface UnifiedJobsState {
  jobs: Job[];
  jobSummaries: JobSummary[];
  driverJobs: DriverJob[];
  drivers: Driver[];

  pendingActions: PendingAction[];
  loaded: boolean;

  setDrivers: (drivers: Driver[]) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  toggleDriverActive: (id: string) => void;
  updateDriverStatus: (id: string, status: NonNullable<Driver["currentStatus"]>) => void;
  updateDriverLocation: (id: string, loc: { lat: number; lng: number }) => void;

  recomputeDriverAssignmentCounts: () => void;

  setJobAssignment: (opts: {
    jobId: string;
    driverId: string | null;
    status: JobStatus;
    mode: AssignmentMode;
  }) => void;

  markDriverJobStatus: (jobId: string, status: DriverJobStatus) => void;
  markDriverStopCompleted: (jobId: string, stopId: string) => void;

  clearPendingAction: (id: string) => void;
}

function generatePendingActionId() {
  return `PA-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export function useUnifiedJobs(): UnifiedJobsState {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobSummaries, setJobSummaries] = useState<JobSummary[]>([]);
  const [driverJobs, setDriverJobs] = useState<DriverJob[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ─────────────────────────────────────────────
  // Load from storage OR from mocks
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(STORAGE_KEY);

    try {
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;

        setJobs(parsed.jobs ?? []);
        setDriverJobs(parsed.driverJobs ?? []);
        setPendingActions(parsed.pendingActions ?? []);

        setDrivers(
          (parsed.drivers ?? []).map((d) => ({
            ...d,
            assignedJobCountToday: d.assignedJobCountToday ?? 0,
          }))
        );

        const summaries = (parsed.jobs ?? []).map((j) =>
          projectJobToSummary(j, mockJobs.find((m) => m.id === j.id))
        );
        setJobSummaries(summaries);
      } else {
  // First load
  const today = new Date().toISOString().slice(0, 10);

  // Start from your existing mockJobs but force a few to be "today"
  const initialSummaries: JobSummary[] = mockJobs.map((job, idx) => ({
    ...job,
    // For demo: first 3 jobs are always "today"
    pickupDate: idx < 3 ? today : job.pickupDate,
  }));

  const initialJobs = bootstrapJobsFromSummaries(initialSummaries);

  // 🔴 OLD: this tried to override from mockDriverJobs
  // const driverJobsSeed = initialSummaries.map((s) => {
  //   const found = mockDriverJobs.find((dj) => dj.id === s.id);
  //   return found ?? projectSummaryToDriverJob(s);
  // });

  // ✅ NEW: always derive driverJobs from JobSummary
  const driverJobsSeed: DriverJob[] = initialSummaries.map((s) =>
    projectSummaryToDriverJob(s)
  );

  const enhancedDrivers: Driver[] = mockDrivers.map((d) => ({
    ...d,
    currentStatus: "offline",
    lastSeenAt: new Date().toISOString(),
    location: null,
    notes: "",
    assignedJobCountToday: 0,
  }));

  setJobs(initialJobs);
  setDriverJobs(driverJobsSeed);
  setJobSummaries(initialSummaries);
  setPendingActions([]);
  setDrivers(enhancedDrivers);
}

    } catch (e) {
      console.error("Unified store load failed", e);
    }

    setLoaded(true);
  }, []);

  // ─────────────────────────────────────────────
  // Persist
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;

    const payload: PersistedState = {
      jobs,
      driverJobs,
      pendingActions,
      drivers,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [jobs, driverJobs, pendingActions, drivers, loaded]);

  // ─────────────────────────────────────────────
  // DRIVER UPDATERS
  // ─────────────────────────────────────────────
  const updateDriver = useCallback((id: string, updates: Partial<Driver>) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  }, []);

  const toggleDriverActive = useCallback((id: string) => {
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isActive: !d.isActive } : d
      )
    );
  }, []);

  const updateDriverStatus = useCallback(
    (id: string, status: NonNullable<Driver["currentStatus"]>) => {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                currentStatus: status,
                lastSeenAt: new Date().toISOString(),
              }
            : d
        )
      );
    },
    []
  );

  const updateDriverLocation = useCallback(
    (id: string, loc: { lat: number; lng: number }) => {
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                location: loc,
                lastSeenAt: new Date().toISOString(),
              }
            : d
        )
      );
    },
    []
  );

  // ─────────────────────────────────────────────
  // Recompute assigned job count (called after assignment)
  // ─────────────────────────────────────────────
  const recomputeDriverAssignmentCounts = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);

    const driverCounts: Record<string, number> = {};

    jobSummaries.forEach((j) => {
      if (j.pickupDate === today && j.driverId) {
        driverCounts[j.driverId] = (driverCounts[j.driverId] ?? 0) + 1;
      }
    });

    setDrivers((prev) =>
      prev.map((d) => ({
        ...d,
        assignedJobCountToday: driverCounts[d.id] ?? 0,
      }))
    );
  }, [jobSummaries]);

  // ─────────────────────────────────────────────
  // Admin: Assignment Logic
  // ─────────────────────────────────────────────
  const setJobAssignment = useCallback(
    (opts: {
      jobId: string;
      driverId: string | null;
      status: JobStatus;
      mode: AssignmentMode;
    }) => {
      const { jobId, driverId, status, mode } = opts;

      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status,
                assignmentMode: mode,
                assignedDriver: driverId
                  ? {
                      driverId,
                      name: "Driver",
                      phone: "",
                      vehicleType: "van" as any,
                      primaryRegion:
                        mockJobs.find((s) => s.id === jobId)?.pickupRegion ??
                        "central",
                    }
                  : undefined,
                updatedAt: new Date().toISOString(),
              }
            : job
        )
      );

      setJobSummaries((prev) =>
        prev.map((s) =>
          s.id === jobId
            ? { ...s, driverId, assignmentMode: mode, status }
            : s
        )
      );

      setDriverJobs((prev) =>
        prev.map((dj) =>
          dj.id === jobId ? { ...dj, status: mapJobStatusToDriverStatus(status) } : dj
        )
      );

      setTimeout(() => {
        recomputeDriverAssignmentCounts();
      }, 50);
    },
    [recomputeDriverAssignmentCounts]
  );

  // ─────────────────────────────────────────────
  // Driver PWA: Status Updates
  // ─────────────────────────────────────────────
  const markDriverJobStatus = useCallback(
    (jobId: string, status: DriverJobStatus) => {
      setDriverJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status } : job
        )
      );

      const mappedStatus = mapDriverStatusToJobStatus(status);

      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, status: mappedStatus }
            : job
        )
      );

      setJobSummaries((prev) =>
        prev.map((s) =>
          s.id === jobId ? { ...s, status: mappedStatus } : s
        )
      );

      setPendingActions((prev) => [
        ...prev,
        {
          id: generatePendingActionId(),
          type: "job-status",
          jobId,
          newStatus: status,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    []
  );

  // ─────────────────────────────────────────────
  // Driver PWA: Stops
  // ─────────────────────────────────────────────
  const markDriverStopCompleted = useCallback(
    (jobId: string, stopId: string) => {
      setDriverJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                stops: job.stops.map((s) =>
                  s.id === stopId ? { ...s, completed: true } : s
                ),
              }
            : job
        )
      );

      setPendingActions((prev) => [
        ...prev,
        {
          id: generatePendingActionId(),
          type: "stop-completed",
          jobId,
          stopId,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    []
  );

  const clearPendingAction = useCallback((id: string) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ─────────────────────────────────────────────
  return {
    jobs,
    jobSummaries,
    driverJobs,
    drivers,
    pendingActions,
    loaded,

    setDrivers,
    updateDriver,
    toggleDriverActive,
    updateDriverStatus,
    updateDriverLocation,

    recomputeDriverAssignmentCounts,

    setJobAssignment,

    markDriverJobStatus,
    markDriverStopCompleted,

    clearPendingAction,
  };
}
