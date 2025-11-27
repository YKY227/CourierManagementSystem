// src/lib/unified-jobs-store.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Job,
  JobSummary,
  JobStatus,
  AssignmentMode,
  AssignmentConfig,
} from "@/lib/types";
import { defaultAssignmentConfig } from "@/lib/types";
import { mockJobs } from "@/lib/mock/jobs";
import {
  mockDriverJobs,
  type DriverJob,
  type DriverJobStatus,
} from "@/lib/mock/driver-jobs";
import {
  scoreDriversForJob,
  pickBestDriver,
} from "@/lib/assignment";

// ─────────────────────────────────────────────
// Offline driver actions (reuse your existing shape)
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

// This is the shape we persist offline
interface PersistedState {
  jobs: Job[];
  driverJobs: DriverJob[];
  pendingActions: PendingAction[];
}

const STORAGE_KEY = "unified-jobs-state-v1";

// ─────────────────────────────────────────────
// Helpers – mapping between status models
// ─────────────────────────────────────────────

/**
 * Map driver-facing status → canonical JobStatus
 * (Driver PWA statuses are a subset / different wording)
 */
function mapDriverStatusToJobStatus(status: DriverJobStatus): JobStatus {
  switch (status) {
    case "booked":
      return "assigned"; // already allocated but not started
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

/**
 * Map JobStatus → driver-facing status (for initial projection).
 */
function mapJobStatusToDriverStatus(status: JobStatus): DriverJobStatus {
  switch (status) {
    case "assigned":
    case "booked":
    case "pending-assignment":
      return "allocated";
    case "out-for-pickup":
      return "pickup";
    case "in-transit":
      return "in-progress";
    case "completed":
      return "completed";
    case "failed":
    case "cancelled":
    case "returned":
      // For now, treat as "completed" in driver view – later you can surface
      // explicit failure/return states in the PWA.
      return "completed";
    default:
      return "allocated";
  }
}

/**
 * Generate a synthetic driver job view from an admin summary.
 * For now we keep using your mockDriverJobs as seed, but this helper
 * is useful when you start creating new jobs only from admin / backend.
 */
function projectSummaryToDriverJob(summary: JobSummary): DriverJob {
  const areaLabelMap: Record<string, string> = {
    central: "Central / CBD",
    east: "East / Tampines",
    west: "West / Jurong",
    north: "North / Woodlands",
    "north-east": "North-East / Sengkang",
    "island-wide": "Island-wide",
  };

  const pickupWindow = summary.pickupSlot;
  const areaLabel = areaLabelMap[summary.pickupRegion] ?? summary.pickupRegion;

  return {
    id: summary.id,
    displayId: summary.publicId,
    serviceType: "same-day", // you can refine using serviceType later
    status: mapJobStatusToDriverStatus(summary.status),
    pickupWindow,
    pickupDate: summary.pickupDate,
    totalStops: summary.stopsCount,
    totalBillableWeightKg: summary.totalBillableWeightKg,
    originLabel: summary.customerName,
    areaLabel,
    // For now we create a minimal stop list; later you will replace this
    // with real route data from booking-store.
    stops: [
      {
        id: `${summary.id}-s1`,
        type: "pickup",
        sequence: 1,
        label: `Pickup – ${summary.customerName}`,
        addressLine1: "TBC from booking-store",
        postalCode: "000000",
        contactName: "Contact TBC",
        contactPhone: "+65 9999 9999",
      },
    ],
  };
}

/**
 * Inverse projection: derive JobSummary from Job.
 * NOTE: Until you wire in your full booking-store, we treat JobSummary as
 * the "operational header" and Job as the canonical record that wraps it.
 *
 * To bootstrap, we'll create Job from JobSummary with placeholder fields.
 */

// We don't know your real booking-store shapes, so we use "any" here.
// Later, replace these with real mapping from booking-store data.
type ServiceTypeAny = any;
type RouteTypeAny = any;
type PickupLocationAny = any;
type DeliveryPointAny = any;
type DeliveryItemAny = any;
type ScheduleInfoAny = any;

function bootstrapJobsFromSummaries(summaries: JobSummary[]): Job[] {
  const nowIso = new Date().toISOString();
  return summaries.map((s) => {
    const j: Job = {
      id: s.id,
      publicId: s.publicId,
      source: s.source ?? "admin",
      jobType: s.jobType,
      status: s.status,
      assignmentMode: s.assignmentMode,
      serviceType: "same-day" as ServiceTypeAny,
      routeType: "point-to-point" as RouteTypeAny,
      pickup: {} as PickupLocationAny,
      deliveries: [] as DeliveryPointAny[],
      items: [] as DeliveryItemAny[],
      schedule: {} as ScheduleInfoAny,
      assignedDriver: s.driverId
        ? {
            driverId: s.driverId,
            name: "TBC",
            phone: "",
            vehicleType: "van" as any,
            primaryRegion: s.pickupRegion,
          }
        : undefined,
      createdAt: s.createdAt,
      updatedAt: nowIso,
      assignmentFailureReason: undefined,
      assignmentScoreDebug: undefined,
    };
    return j;
  });
}

function projectJobToSummary(job: Job, summaryFallback?: JobSummary): JobSummary {
  // When we eventually have full booking data, we’ll get pickupRegion/date
  // from job.pickup / job.schedule. For now we rely on the fallback summary.
  if (!summaryFallback) {
    // Extremely minimal fallback – you should never hit this in current setup
    return {
      id: job.id,
      publicId: job.publicId,
      customerName: "Unknown customer",
      jobType: job.jobType,
      status: job.status,
      assignmentMode: job.assignmentMode,
      pickupRegion: "central",
      pickupDate: job.createdAt.slice(0, 10),
      pickupSlot: "TBC",
      driverId: job.assignedDriver?.driverId ?? null,
      stopsCount: 1,
      totalBillableWeightKg: 0,
      createdAt: job.createdAt,
    };
  }

  return {
    ...summaryFallback,
    status: job.status,
    assignmentMode: job.assignmentMode,
    driverId: job.assignedDriver?.driverId ?? summaryFallback.driverId ?? null,
  };
}

// ─────────────────────────────────────────────
// Unified store hook
// ─────────────────────────────────────────────

export interface UnifiedJobsState {
  // Canonical jobs for future backend / booking-store integration
  jobs: Job[];

  // Admin view: summaries
  jobSummaries: JobSummary[];

  // Driver view: jobs (PWA)
  driverJobs: DriverJob[];

  // Offline driver actions
  pendingActions: PendingAction[];

  loaded: boolean;

  // Admin operations
  autoAssignPending: (configOverride?: AssignmentConfig) => void;
  setJobAssignment: (opts: {
    jobId: string;
    driverId: string | null;
    status: JobStatus;
    mode: AssignmentMode;
  }) => void;

  // Driver operations
  markDriverJobStatus: (jobId: string, status: DriverJobStatus) => void;
  markDriverStopCompleted: (jobId: string, stopId: string) => void;

  // Pending-action management (later, when backend sync exists)
  clearPendingAction: (id: string) => void;
}

function generatePendingActionId() {
  return `PA-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function useUnifiedJobs(): UnifiedJobsState {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobSummaries, setJobSummaries] = useState<JobSummary[]>([]);
  const [driverJobs, setDriverJobs] = useState<DriverJob[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Initial load from localStorage or mock data
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        setJobs(parsed.jobs ?? []);
        setDriverJobs(parsed.driverJobs ?? []);
        setPendingActions(parsed.pendingActions ?? []);

        // Rebuild jobSummaries from jobs + original mockJobs as a fallback
        const summaries = (parsed.jobs ?? []).map((job) => {
          const fallback = mockJobs.find((s) => s.id === job.id);
          return projectJobToSummary(job, fallback);
        });
        setJobSummaries(summaries);
      } else {
        // First run: bootstrap from existing mocks
        const initialSummaries = mockJobs;
        const initialJobs = bootstrapJobsFromSummaries(initialSummaries);

        // For driver view, try to align existing mockDriverJobs by id.
        const driverJobsSeed: DriverJob[] = initialSummaries.map((s) => {
          const existing = mockDriverJobs.find((d) => d.id === s.id);
          return existing ?? projectSummaryToDriverJob(s);
        });

        setJobs(initialJobs);
        setJobSummaries(initialSummaries);
        setDriverJobs(driverJobsSeed);
        setPendingActions([]);
      }
    } catch (e) {
      console.error("Failed to load unified job state", e);
      // Fallback to mocks
      const initialSummaries = mockJobs;
      const initialJobs = bootstrapJobsFromSummaries(initialSummaries);
      const driverJobsSeed: DriverJob[] = initialSummaries.map((s) => {
        const existing = mockDriverJobs.find((d) => d.id === s.id);
        return existing ?? projectSummaryToDriverJob(s);
      });
      setJobs(initialJobs);
      setJobSummaries(initialSummaries);
      setDriverJobs(driverJobsSeed);
      setPendingActions([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Persist whenever core state changes
  useEffect(() => {
    if (!loaded) return;
    try {
      const payload: PersistedState = {
        jobs,
        driverJobs,
        pendingActions,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to save unified job state", e);
    }
  }, [jobs, driverJobs, pendingActions, loaded]);

  // ─────────────────────────────────────────────
  // Admin: set assignment explicitly (manual or auto)
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
                      // We don't know driver name/phone here yet – later you can
                      // look up from your Driver list and populate properly.
                      name: "Driver",
                      phone: "",
                      vehicleType: "van" as any,
                      primaryRegion:
                        mockJobs.find((j) => j.id === jobId)?.pickupRegion ??
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
            ? {
                ...s,
                status,
                assignmentMode: mode,
                driverId,
              }
            : s
        )
      );

      setDriverJobs((prev) =>
        prev.map((dj) =>
          dj.id === jobId
            ? {
                ...dj,
                status: mapJobStatusToDriverStatus(status),
              }
            : dj
        )
      );
    },
    []
  );

  // ─────────────────────────────────────────────
  // Admin: auto-assign pending jobs (using assignment.ts)
  // ─────────────────────────────────────────────
  const autoAssignPending = useCallback(
    (configOverride?: AssignmentConfig) => {
      setJobSummaries((prevSummaries) => {
        const config = configOverride ?? defaultAssignmentConfig;

        // Pretend we have "today" filter like your admin page
        const today = new Date().toISOString().slice(0, 10);

        // Build driver job counts from summaries (driverId/date)
        const driverJobCounts: Record<string, number> = {};
        for (const s of prevSummaries) {
          if (!s.driverId) continue;
          if (s.pickupDate !== today) continue;
          driverJobCounts[s.driverId] = (driverJobCounts[s.driverId] || 0) + 1;
        }

        const pending = prevSummaries.filter(
          (s) => s.status === "pending-assignment"
        );

        if (pending.length === 0) {
          return prevSummaries;
        }

        // You already have activeDrivers & assignmentConfig in your /admin/jobs page.
        // Here we only run the scoring; you'll still pass real drivers in the page.
        // So we just keep a projection that the page can use.
        // NOTE: To keep this self-contained, we don't call scoreDriversForJob here;
        // instead, your /admin/jobs/page.tsx will keep using its own logic for now.
        // This function becomes more important once you move that logic into the store.

        return prevSummaries;
      });

      // In this first iteration, we keep auto-assign logic in /admin/jobs/page.tsx
      // (which you already implemented) and let it call setJobAssignment()
      // after pickBestDriver(). This keeps the refactor incremental.
    },
    []
  );

  // ─────────────────────────────────────────────
  // Driver: mark job status (offline-first)
  // ─────────────────────────────────────────────
  const markDriverJobStatus = useCallback(
    (jobId: string, status: DriverJobStatus) => {
      setDriverJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status } : job
        )
      );

      // Reflect in canonical Job + Admin summary
      const mappedJobStatus = mapDriverStatusToJobStatus(status);

      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: mappedJobStatus,
                updatedAt: new Date().toISOString(),
              }
            : job
        )
      );

      setJobSummaries((prev) =>
        prev.map((s) =>
          s.id === jobId
            ? {
                ...s,
                status: mappedJobStatus,
              }
            : s
        )
      );

      const action: PendingAction = {
        id: generatePendingActionId(),
        type: "job-status",
        jobId,
        newStatus: status,
        createdAt: new Date().toISOString(),
      };
      setPendingActions((prev) => [...prev, action]);
    },
    []
  );

  // ─────────────────────────────────────────────
  // Driver: mark stop completed (offline-first)
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

      const action: PendingAction = {
        id: generatePendingActionId(),
        type: "stop-completed",
        jobId,
        stopId,
        createdAt: new Date().toISOString(),
      };
      setPendingActions((prev) => [...prev, action]);
    },
    []
  );

  const clearPendingAction = useCallback((id: string) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    jobs,
    jobSummaries,
    driverJobs,
    pendingActions,
    loaded,
    autoAssignPending,
    setJobAssignment,
    markDriverJobStatus,
    markDriverStopCompleted,
    clearPendingAction,
  };
}
