// src/app/admin/jobs/page.tsx
"use client";

import { useMemo, useState } from "react";

import type {
  JobSummary,
  JobStatus,
  JobType,
  AssignmentMode,
  RegionCode,
  Driver,
  AssignmentConfig,
  HardConstraintKey,  
} from "@/lib/types";
import { mockJobs } from "@/lib/mock/jobs";
import { mockDrivers } from "@/lib/mock/drivers";
import { scoreDriversForJob, pickBestDriver } from "@/lib/assignment";
import { defaultAssignmentConfig } from "@/lib/types";

// ─────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────
function regionLabel(region: RegionCode): string {
  switch (region) {
    case "central":
      return "Central";
    case "east":
      return "East";
    case "west":
      return "West";
    case "north":
      return "North";
    case "north-east":
      return "North-East";
    case "island-wide":
      return "Island-wide";
    default:
      return region;
  }
}

function jobTypeBadge(type: JobType) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium";
  if (type === "scheduled") {
    return (
      <span className={`${base} bg-sky-50 text-sky-700 ring-1 ring-sky-100`}>
        Scheduled
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-amber-50 text-amber-700 ring-1 ring-amber-100`}
    >
      Ad-hoc / Urgent
    </span>
  );
}

function statusBadge(status: JobStatus) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium";
  switch (status) {
    case "booked":
      return (
        <span
          className={`${base} bg-slate-50 text-slate-700 ring-1 ring-slate-200`}
        >
          Booked
        </span>
      );
    case "pending-assignment":
      return (
        <span
          className={`${base} bg-orange-50 text-orange-700 ring-1 ring-orange-200`}
        >
          Pending assignment
        </span>
      );
    case "assigned":
      return (
        <span
          className={`${base} bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200`}
        >
          Assigned
        </span>
      );
    case "out-for-pickup":
      return (
        <span
          className={`${base} bg-blue-50 text-blue-700 ring-1 ring-blue-200`}
        >
          Out for pickup
        </span>
      );
    case "in-transit":
      return (
        <span
          className={`${base} bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200`}
        >
          In transit
        </span>
      );
    case "completed":
      return (
        <span
          className={`${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`}
        >
          Completed
        </span>
      );
    case "failed":
      return (
        <span
          className={`${base} bg-red-50 text-red-700 ring-1 ring-red-200`}
        >
          Failed
        </span>
      );
    case "cancelled":
      return (
        <span
          className={`${base} bg-slate-100 text-slate-500 ring-1 ring-slate-200`}
        >
          Cancelled
        </span>
      );
    case "returned":
      return (
        <span
          className={`${base} bg-purple-50 text-purple-700 ring-1 ring-purple-200`}
        >
          Returned
        </span>
      );
    default:
      return (
        <span
          className={`${base} bg-slate-50 text-slate-700 ring-1 ring-slate-200`}
        >
          {status}
        </span>
      );
  }
}

function assignmentModeBadge(mode: AssignmentMode | undefined) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium";
  if (!mode) {
    return (
      <span
        className={`${base} bg-slate-50 text-slate-500 ring-1 ring-slate-200`}
      >
        Not assigned
      </span>
    );
  }
  if (mode === "auto") {
    return (
      <span
        className={`${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`}
      >
        Auto-assigned
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-sky-50 text-sky-700 ring-1 ring-sky-200`}
    >
      Manual assign
    </span>
  );
}

// ─────────────────────────────────────────────
// Types / local state shapes
// ─────────────────────────────────────────────
type AssignModalState = {
  open: boolean;
  job: JobSummary | null;
};

type AutoAssignSummary = {
  total: number;
  assigned: number;
  failed: number;
};

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobSummary[]>(() => mockJobs);
  const [assignModal, setAssignModal] = useState<AssignModalState>({
    open: false,
    job: null,
  });
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");

  // Assignment config (from types default). In future, this will be fed by the
  // /admin/assignment-policy/page.tsx with localStorage.
  const [assignmentConfig] = useState<AssignmentConfig>(
    () => defaultAssignmentConfig
  );

  // Keep a small “last run” summary for auto-assign
  const [lastAutoAssignSummary, setLastAutoAssignSummary] =
    useState<AutoAssignSummary | null>(null);

    const [debugDrawer, setDebugDrawer] = useState<{
  open: boolean;
  job: JobSummary | null;
  scores: ReturnType<typeof scoreDriversForJob> | null;
}>({
  open: false,
  job: null,
  scores: null,
});

  // today as "YYYY-MM-DD"
  const today = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const activeDrivers = useMemo(
    () => mockDrivers.filter((d: Driver) => d.isActive),
    []
  );

  // Driver load for today (used in strip + scoring context)
  const driverJobCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of activeDrivers) {
      counts[d.id] = 0;
    }

    for (const job of jobs) {
      if (!job.driverId) continue;
      if (job.pickupDate !== today) continue;
      counts[job.driverId] = (counts[job.driverId] || 0) + 1;
    }

    return counts;
  }, [jobs, activeDrivers, today]);

  const pendingJobs = useMemo(
    () => jobs.filter((j) => j.status === "pending-assignment"),
    [jobs]
  );

  const activeJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.status !== "pending-assignment" &&
          j.status !== "completed" &&
          j.status !== "cancelled"
      ),
    [jobs]
  );

  const completedJobs = useMemo(
    () => jobs.filter((j) => j.status === "completed"),
    [jobs]
  );

  /**
   * Use the assignment engine to find the recommended driver for a given job.
   * Returns driverId or null if no suitable driver.
   */
  const getRecommendedDriverId = (job: JobSummary | null): string | null => {
  if (!job) return null;
  if (activeDrivers.length === 0) return null;

  const scores = scoreDriversForJob(job, activeDrivers, assignmentConfig, {
    driverJobCounts,
  });

  const best = pickBestDriver(scores);
  return best?.driverId ?? null;
};


  const openAssignModal = (job: JobSummary) => {
    setSelectedDriverId("");
    setAssignModal({ open: true, job });
  };

  const closeAssignModal = () => {
    setAssignModal({ open: false, job: null });
    setSelectedDriverId("");
  };

  const openDebugDrawer = (job: JobSummary) => {
  const scores = scoreDriversForJob(job, activeDrivers, assignmentConfig, {
    driverJobCounts,
  });

  setDebugDrawer({
    open: true,
    job,
    scores,
  });
};

const closeDebugDrawer = () => {
  setDebugDrawer({
    open: false,
    job: null,
    scores: null,
  });
};


  const handleConfirmAssign = () => {
    if (!assignModal.job || !selectedDriverId) {
      alert("Please select a driver.");
      return;
    }

    const driver = activeDrivers.find((d) => d.id === selectedDriverId);
    if (!driver) {
      alert("Selected driver not found.");
      return;
    }

    setJobs((prev) =>
      prev.map((job) =>
        job.id === assignModal.job!.id
          ? {
              ...job,
              driverId: driver.id,
              status: "assigned" as JobStatus,
              assignmentMode: "manual" as AssignmentMode,
            }
          : job
      )
    );

    closeAssignModal();
  };

  /**
   * Run auto-assign logic for ALL pending jobs (prototype only).
   * Uses scoreDriversForJob + pickBestDriver and updates jobs in state.
   */
  const handleAutoAssignPending = () => {
    setJobs((prev) => {
      const pending = prev.filter((j) => j.status === "pending-assignment");
      if (pending.length === 0) {
        setLastAutoAssignSummary({
          total: 0,
          assigned: 0,
          failed: 0,
        });
        return prev;
      }

      // Build a mutable copy of today's counts so we can update as we assign
      const tempCounts: Record<string, number> = {};
      for (const d of activeDrivers) {
        tempCounts[d.id] = 0;
      }
      for (const job of prev) {
        if (!job.driverId) continue;
        if (job.pickupDate !== today) continue;
        tempCounts[job.driverId] = (tempCounts[job.driverId] || 0) + 1;
      }

      let assigned = 0;
      let failed = 0;

      const updated = prev.map((job) => {
        if (job.status !== "pending-assignment") {
          return job;
        }

        const scores = scoreDriversForJob(
          job,
          activeDrivers,
          assignmentConfig,
          {
            driverJobCounts: tempCounts,
          }
        );

        const best = pickBestDriver(scores);

        if (best) {
          tempCounts[best.driverId] = (tempCounts[best.driverId] || 0) + 1;
          assigned++;
          return {
            ...job,
            driverId: best.driverId,
            status: "assigned" as JobStatus,
            assignmentMode: "auto" as AssignmentMode,
          };
        } else {
          failed++;
          return job;
        }
      });

      setLastAutoAssignSummary({
        total: pending.length,
        assigned,
        failed,
      });

      return updated;
    });
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Jobs Overview
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Monitor scheduled and ad-hoc jobs, and manually or automatically
              assign drivers.
            </p>
          </div>
          <div className="flex flex-col items-end text-xs text-slate-500">
            <span>
              Pending:{" "}
              <span className="font-semibold text-orange-600">
                {pendingJobs.length}
              </span>
            </span>
            <span>
              Active:{" "}
              <span className="font-semibold text-sky-700">
                {activeJobs.length}
              </span>
            </span>
            <span>
              Completed (mock):{" "}
              <span className="font-semibold text-emerald-700">
                {completedJobs.length}
              </span>
            </span>
          </div>
        </header>

        {/* Capacity strip */}
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold text-slate-700">
            Today&apos;s driver load (prototype)
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeDrivers.map((d) => {
              const count = driverJobCounts[d.id] ?? 0;

              const colour =
                count === 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : count < 3
                  ? "bg-sky-50 text-sky-700 border-sky-100"
                  : "bg-amber-50 text-amber-700 border-amber-100";

              return (
                <div
                  key={d.id}
                  className={`rounded-lg border px-3 py-2 text-[11px] ${colour}`}
                >
                  <div className="font-medium">{d.name}</div>
                  <div className="text-[10px]">
                    Jobs today:{" "}
                    <span className="font-semibold">{count}</span> /{" "}
                    {d.maxJobsPerDay}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pending Assignment Section */}
        <section className="mb-8">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Pending Assignment
              </h2>
              <p className="text-xs text-slate-500">
                Jobs that need manual review or where auto-assignment hasn&apos;t
                run yet.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={handleAutoAssignPending}
                disabled={pendingJobs.length === 0 || activeDrivers.length === 0}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Run auto-assign for pending
              </button>
              {lastAutoAssignSummary && (
                <p className="text-[10px] text-slate-500">
                  Last run: {lastAutoAssignSummary.assigned} assigned,{" "}
                  {lastAutoAssignSummary.failed} still pending (of{" "}
                  {lastAutoAssignSummary.total} jobs).
                </p>
              )}
            </div>
          </div>

          {pendingJobs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No jobs currently pending assignment. Auto-assigned jobs will
              appear in the active list below.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Job
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Customer
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Pickup
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Stops / Weight
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pendingJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-3 py-2 align-top">
                        <div className="font-mono text-[11px] text-slate-800">
                          {job.publicId}
                        </div>
                        <div className="mt-1">
                          {statusBadge(job.status)}{" "}
                          <span className="ml-1 inline-block">
                            {assignmentModeBadge(job.assignmentMode)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="text-xs font-medium text-slate-900">
                          {job.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Created: {new Date(job.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="text-xs text-slate-800">
                          {job.pickupDate}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {job.pickupSlot}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          Region: {regionLabel(job.pickupRegion)}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {jobTypeBadge(job.jobType)}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="text-xs text-slate-800">
                          {job.stopsCount} stop
                          {job.stopsCount > 1 ? "s" : ""}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {job.totalBillableWeightKg.toFixed(1)} kg billable
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        <button
                          type="button"
                          onClick={() => openAssignModal(job)}
                          className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-sky-700"
                        >
                          Assign driver…
                        </button>

                        <button
                          type="button"
                          onClick={() => openDebugDrawer(job)}
                          className="inline-flex items-center rounded-lg border border-slate-300 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-100"
                        >
                          Debug
                        </button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Active Jobs Section */}
        <section className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Active Jobs
            </h2>
            <p className="text-xs text-slate-500">
              Jobs that are assigned or in progress (mock data).
            </p>
          </div>

          {activeJobs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
              No active jobs at the moment.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Job
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Customer
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Pickup
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Driver
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {activeJobs.map((job) => {
                    const driver =
                      job.driverId &&
                      mockDrivers.find((d: Driver) => d.id === job.driverId);
                    return (
                      <tr key={job.id}>
                        <td className="px-3 py-2 align-top">
                          <div className="font-mono text-[11px] text-slate-800">
                            {job.publicId}
                          </div>
                          <div className="mt-1">
                            {statusBadge(job.status)}{" "}
                            <span className="ml-1 inline-block">
                              {assignmentModeBadge(job.assignmentMode)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-xs font-medium text-slate-900">
                            {job.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {job.stopsCount} stop
                            {job.stopsCount > 1 ? "s" : ""},{" "}
                            {job.totalBillableWeightKg.toFixed(1)} kg
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-xs text-slate-800">
                            {job.pickupDate}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {job.pickupSlot}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            Region: {regionLabel(job.pickupRegion)}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          {driver ? (
                            <>
                              <div className="text-xs font-medium text-slate-900">
                                {driver.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {driver.vehicleType.toUpperCase()} ·{" "}
                                {regionLabel(driver.primaryRegion)}
                              </div>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              (No driver assigned)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {jobTypeBadge(job.jobType)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Completed Section (compact) */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Recently Completed
            </h2>
            <p className="text-xs text-slate-500">
              For prototype, this shows completed jobs from mock data.
            </p>
          </div>

          {completedJobs.length === 0 ? (
            <p className="text-xs text-slate-500">
              No completed jobs in mock dataset.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Job
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Customer
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Pickup
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {completedJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-3 py-2 align-top">
                        <div className="font-mono text-[11px] text-slate-800">
                          {job.publicId}
                        </div>
                        <div className="mt-1">{statusBadge(job.status)}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="text-xs font-medium text-slate-900">
                          {job.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {job.stopsCount} stops ·{" "}
                          {job.totalBillableWeightKg.toFixed(1)} kg
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="text-xs text-slate-800">
                          {job.pickupDate}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {job.pickupSlot}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          Region: {regionLabel(job.pickupRegion)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Assign Driver Modal */}
      {assignModal.open && assignModal.job && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-900">
              Assign driver
            </h2>
            <p className="mt-1 text-[11px] text-slate-600">
              Job{" "}
              <span className="font-mono font-medium">
                {assignModal.job.publicId}
              </span>{" "}
              · {assignModal.job.customerName}
            </p>

            {/* Recommended driver hint */}
            {(() => {
              const recommendedId = getRecommendedDriverId(assignModal.job);
              const recommendedDriver = recommendedId
                ? activeDrivers.find((d) => d.id === recommendedId)
                : undefined;

              if (!recommendedDriver) return null;

              return (
                <p className="mt-2 text-[11px] text-emerald-700">
                  Recommended:{" "}
                  <span className="font-medium">
                    {recommendedDriver.name}
                  </span>{" "}
                  ({regionLabel(recommendedDriver.primaryRegion)} ·{" "}
                  {driverJobCounts[recommendedDriver.id] ?? 0} jobs today)
                </p>
              );
            })()}

            <div className="mt-4 space-y-2">
              <label
                htmlFor="driver-select"
                className="text-xs font-medium text-slate-700"
              >
                Select driver
              </label>
              <select
                id="driver-select"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="">-- Choose a driver --</option>
                {activeDrivers.map((d) => {
                  const recommendedId = getRecommendedDriverId(assignModal.job);
                  const isRecommended = d.id === recommendedId;
                  const jobsToday = driverJobCounts[d.id] ?? 0;

                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} · {d.vehicleType.toUpperCase()} ·{" "}
                      {regionLabel(d.primaryRegion)} · Jobs today: {jobsToday} /{" "}
                      {d.maxJobsPerDay}
                      {isRecommended ? "  ⭐ Recommended" : ""}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-500">
                In the real system, this list will be filtered by eligibility
                (region, capacity, working hours, etc.), and the scoring engine
                will automatically highlight the best candidate based on your
                Assignment Policy settings.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={closeAssignModal}
                className="text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-700"
              >
                Confirm assign
              </button>
            </div>
          </div>
        </div>
      )}

      {debugDrawer.open && debugDrawer.job && (
  <div className="fixed inset-0 z-50 flex">
    {/* overlay */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={closeDebugDrawer}
    />

    {/* panel */}
    <div className="relative ml-auto h-full w-full max-w-md bg-white p-5 shadow-xl">
      <h2 className="text-sm font-semibold text-slate-900">
        Assignment Debug
      </h2>
      <p className="mt-1 text-[11px] text-slate-600">
        Job <span className="font-mono">{debugDrawer.job.publicId}</span>
      </p>

      {/* policy summary */}
      <div className="mt-3 rounded-lg border bg-slate-50 p-3 text-[11px] text-slate-700">
        <div className="font-semibold text-slate-900 mb-1">
          Assignment Policy (weights)
        </div>
        <div>Region: {assignmentConfig.softRules.regionScore.weight}</div>
        <div>Load: {assignmentConfig.softRules.loadBalanceScore.weight}</div>
        <div>Fairness: {assignmentConfig.softRules.fairnessScore.weight}</div>
      </div>

      {/* Score table */}
      <div className="mt-4 text-xs">
        <h3 className="text-xs font-semibold text-slate-800 mb-2">
          Driver Scoring Breakdown
        </h3>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {debugDrawer.scores?.map((s) => {
            const driver = activeDrivers.find((d) => d.id === s.driverId);
            if (!driver) return null;

            const isWinner =
              s.totalScore ===
              Math.max(...debugDrawer.scores!.map((x) => x.totalScore));

            return (
              <div
                key={s.driverId}
                className={`rounded-lg border p-3 ${
                  isWinner
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="font-medium text-slate-900">
                  {driver.name}
                  {isWinner && (
                    <span className="ml-1 text-[10px] text-emerald-700">
                      (Recommended)
                    </span>
                  )}
                </div>

                <div className="mt-1 text-[11px] text-slate-500">
                  Region: {regionLabel(driver.primaryRegion)} · Today load:{" "}
                  {driverJobCounts[driver.id] ?? 0}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  <div>
                    <span className="font-medium">Region score:</span>{" "}
                    {s.components.regionScore.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Load score:</span>{" "}
                    {s.components.loadBalanceScore.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Fairness:</span>{" "}
                    {s.components.fairnessScore.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Final:</span>{" "}
                    {s.totalScore.toFixed(2)}
                  </div>
                </div>

                {/* Hard constraint flags */}
                {s.hardConstraints && (
                  <div className="mt-3 text-[11px]">
                    {(
                      Object.entries(s.hardConstraints) as [HardConstraintKey, boolean][]
                    ).map(([key, passed]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            passed ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-slate-600">
                          {key} {passed ? "✓" : "✗"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}


              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={closeDebugDrawer}
        className="mt-4 w-full rounded-lg bg-slate-800 py-2 text-xs text-white hover:bg-slate-900"
      >
        Close
      </button>
    </div>
  </div>
)}

    </div>
  );
}
