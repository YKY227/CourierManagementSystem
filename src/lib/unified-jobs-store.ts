"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Job,
  JobSummary,
  JobStatus,
  AssignmentMode,
  AssignmentConfig,
  RegionCode,
} from "@/lib/types";

import { defaultAssignmentConfig } from "@/lib/types";
import { mockJobs } from "@/lib/mock/jobs";
import { mockDrivers } from "@/lib/mock/drivers";

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
// DRIVER MODEL (Enhanced)
// ─────────────────────────────────────────────
export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;

  vehicleType: string;
  vehiclePlate: string;

  primaryRegion: RegionCode;
  secondaryRegions?: RegionCode[];

  maxJobsPerDay: number;
  maxJobsPerSlot: number;
  workStartHour: number;
  workEndHour: number;

  isActive: boolean;

  // Enhanced fields
  currentStatus: "online" | "offline" | "break" | "unavailable";
  lastSeenAt: string;
  location: { lat: number; lng: number } | null;
  notes?: string;

  // Computed dynamically
  assignedJobCountToday?: number;
}

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
  const areaLabelMap: any = {
    central: "Central / CBD",
    east: "East / Tampines",
    west: "West / Jurong",
    north: "North / Woodlands",
    "north-east": "North-East / Sengkang",
    "island-wide": "Island-wide",
  };

  return {
    id: summary.id,
    displayId: summary.publicId,
    status: mapJobStatusToDriverStatus(summary.status),
    serviceType: "same-day",
    pickupDate: summary.pickupDate,
    pickupWindow: summary.pickupSlot,
    totalStops: summary.stopsCount,
    totalBillableWeightKg: summary.totalBillableWeightKg,
    originLabel: summary.customerName,
    areaLabel: areaLabelMap[summary.pickupRegion] ?? summary.pickupRegion,
    stops: [
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
    ],
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
    schedule: {},
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
  updateDriverStatus: (id: string, status: Driver["currentStatus"]) => void;
  updateDriverLocation: (id: string, loc: { lat: number; lng: number }) => void;

  recomputeDriverAssignmentCounts: () => void;

  autoAssignPending: (configOverride?: AssignmentConfig) => void;
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

        // DRIVER LOAD
        setDrivers(
          (parsed.drivers ?? []).map((d) => ({
            ...d,
            assignedJobCountToday: 0,
          }))
        );

        // Rebuild summaries
        const summaries = (parsed.jobs ?? []).map((j) =>
          projectJobToSummary(j, mockJobs.find((m) => m.id === j.id))
        );
        setJobSummaries(summaries);
      } else {
        // First load
        const initialSummaries = mockJobs;
        const initialJobs = bootstrapJobsFromSummaries(initialSummaries);

        const driverJobsSeed = initialSummaries.map((s) => {
          const found = mockDriverJobs.find((dj) => dj.id === s.id);
          return found ?? projectSummaryToDriverJob(s);
        });

        // Use mockDrivers → then enrich with enhanced fields
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
    (id: string, status: Driver["currentStatus"]) => {
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

      // Update canonical Job
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

      // Update admin summary
      setJobSummaries((prev) =>
        prev.map((s) =>
          s.id === jobId
            ? { ...s, driverId, assignmentMode: mode, status }
            : s
        )
      );

      // Update DriverJob status
      setDriverJobs((prev) =>
        prev.map((dj) =>
          dj.id === jobId ? { ...dj, status: mapJobStatusToDriverStatus(status) } : dj
        )
      );

      // Update assignment count
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
      // Update driverJobs
      setDriverJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status } : job
        )
      );

      // Reflect in Jobs + Summaries
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

      // Offline queue
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
