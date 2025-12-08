// src/app/driver/jobs/page.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useUnifiedJobs } from "@/lib/unified-jobs-store";
import { useDriverIdentity } from "@/lib/use-driver-identity";
import type { DriverJob, RoutePattern, DriverJobStatus } from "@/lib/types";

// ─────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────
function statusLabel(status: DriverJobStatus | string) {
  switch (status) {
    case "booked":
      return "Booked";
    case "allocated":
      return "Allocated";
    case "pickup":
      return "Out for pickup";
    case "in-progress":
      return "In progress";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

function routePatternLabel(pattern?: RoutePattern) {
  switch (pattern) {
    case "one-to-many":
      return "1 → many";
    case "many-to-one":
      return "Many → 1";
    case "round-trip":
      return "Round trip";
    case "one-to-one":
      return "1 → 1";
    default:
      return "";
  }
}

// Normalise pickupDate to "YYYY-MM-DD"
function toDateKey(value: string | null | undefined): string {
  if (!value) return "";
  // Handles both "2025-12-02" and "2025-12-02T00:00:00.000Z"
  return value.slice(0, 10);
}

// Defensively parse weight (string | number → number)
function toWeightNumber(weight: unknown): number {
  if (typeof weight === "number") return weight;
  if (typeof weight === "string") {
    const n = Number(weight);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────
export default function DriverJobsPage() {
  // NOTE: We don't actually use markDriverJobStatus / markDriverStopCompleted
  // on this list page; they are used in the job detail page.
  const { driverJobs, loaded } = useUnifiedJobs();
  const { driver } = useDriverIdentity();

  // Narrow type locally to allow optional driverId/assignedDriverId
  type DriverJobWithDriverId = DriverJob & {
    driverId?: string | null;
    assignedDriverId?: string | null;
  };

  const { todaysJobs, upcomingJobs } = useMemo(() => {
    const all = driverJobs as DriverJobWithDriverId[];

    if (!driver) {
      return {
        todaysJobs: [] as DriverJobWithDriverId[],
        upcomingJobs: [] as DriverJobWithDriverId[],
      };
    }

    // Check if any jobs are tagged with driver ids
    const anyTagged = all.some(
      (j) => j.driverId != null || j.assignedDriverId != null,
    );

    // If tagged: only show jobs for this driver
    // If not tagged yet (pure mock stage): show all jobs
    const visibleJobs = anyTagged
      ? all.filter(
          (j) =>
            j.driverId === driver.id || j.assignedDriverId === driver.id,
        )
      : all;

    const todayStr = new Date().toISOString().slice(0, 10);

    const todays = visibleJobs.filter((j) => {
      const dateKey = toDateKey(j.pickupDate);
      return dateKey === todayStr && j.status !== "completed";
    });

    const upcoming = visibleJobs.filter((j) => {
      const dateKey = toDateKey(j.pickupDate);
      return dateKey > todayStr && j.status !== "completed";
    });

    console.log("[DriverJobsPage] visibleJobs:", visibleJobs);
    console.log("[DriverJobsPage] todaysJobs:", todays);
    console.log("[DriverJobsPage] upcomingJobs:", upcoming);

    return { todaysJobs: todays, upcomingJobs: upcoming };
  }, [driverJobs, driver]);

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-xs text-slate-400">
        Loading jobs…
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-xs text-slate-400">
        No driver selected. Please log in again.
      </div>
    );
  }

  const hasAnyJobs = todaysJobs.length > 0 || upcomingJobs.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-4 text-slate-50">
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          Welcome,
        </p>
        <h1 className="text-lg font-semibold">
          {driver.name ?? "Driver"}
        </h1>
        <p className="text-[11px] text-slate-400">
          Today&apos;s and upcoming runs linked to your account.
        </p>
      </header>

      {!hasAnyJobs && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/70 px-4 py-6 text-center text-xs text-slate-400">
          No jobs currently assigned to you.
          <br />
          Once the admin assigns jobs to your driver ID, they&apos;ll appear
          here.
        </div>
      )}

      {todaysJobs.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Today&apos;s Jobs
          </h2>
          <div className="space-y-3">
            {todaysJobs.map((job) => {
              const weight = toWeightNumber(job.totalBillableWeightKg);
              const dateKey = toDateKey(job.pickupDate);

              return (
                <Link
                  key={job.id}
                  href={`/driver/job/${job.id}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs transition hover:border-sky-500 hover:bg-slate-900"
                >
                  {/* Top row: ID + status pill + route pattern */}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-mono text-[11px] text-slate-400">
                      {job.displayId}
                    </p>
                    <span className="rounded-full border border-sky-500 bg-sky-900/60 px-2 py-0.5 text-[10px] font-medium text-sky-100">
                      {statusLabel(job.status)}
                    </span>
                    {job.routePattern && (
                      <span className="rounded-full border border-slate-600 bg-slate-800/80 px-2 py-0.5 text-[9px] font-medium text-slate-100">
                        Route: {routePatternLabel(job.routePattern)}
                      </span>
                    )}
                  </div>

                  {/* Middle: customer + area */}
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-50">
                      {job.originLabel}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Area: {job.areaLabel}
                    </p>
                  </div>

                  {/* Info row */}
                  <div className="mb-3 flex items-start justify-between gap-4 text-[11px] text-slate-300">
                    <div>
                      <p className="text-slate-400">Pickup</p>
                      <p className="font-medium">
                        {dateKey} · {job.pickupWindow}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">Stops / Weight</p>
                      <p className="font-medium">
                        {job.totalStops} stops · {weight.toFixed(1)} kg
                      </p>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Tap to view route &amp; stops →</span>
                    <span className="font-medium text-sky-300">View job</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {upcomingJobs.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Upcoming Jobs
          </h2>
          <div className="space-y-3">
            {upcomingJobs.map((job) => {
              const weight = toWeightNumber(job.totalBillableWeightKg);
              const dateKey = toDateKey(job.pickupDate);

              return (
                <Link
                  key={job.id}
                  href={`/driver/job/${job.id}`}
                  className="block rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs hover:border-sky-500 hover:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-[11px] text-slate-400">
                        {job.displayId}
                      </p>
                      <p className="text-sm font-semibold text-slate-50">
                        {job.originLabel}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {job.areaLabel}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-slate-300">
                      <p>{dateKey}</p>
                      <p className="font-medium">{job.pickupWindow}</p>
                      <p className="mt-1 text-slate-400">
                        {job.totalStops} stops · {weight.toFixed(1)} kg
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Not started
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
