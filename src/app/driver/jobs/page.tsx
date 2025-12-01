// src/app/driver/jobs/page.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useUnifiedJobs } from "@/lib/unified-jobs-store";
import { useDriverIdentity } from "@/lib/use-driver-identity";
import type { DriverJob } from "@/lib/mock/driver-jobs";

function statusLabel(status: string) {
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

export default function DriverJobsPage() {
  const { driverJobs, loaded } = useUnifiedJobs();
  const { driver } = useDriverIdentity();

  // Narrow type locally to allow optional driverId/assignedDriverId
  type DriverJobWithDriverId = DriverJob & {
    driverId?: string | null;
    assignedDriverId?: string | null;
  };

  const { todaysJobs, upcomingJobs } = useMemo(() => {
    const all = driverJobs as DriverJobWithDriverId[];

    // If no driver (shouldn't happen because layout guards), just show nothing
    if (!driver) {
      return { todaysJobs: [] as DriverJobWithDriverId[], upcomingJobs: [] as DriverJobWithDriverId[] };
    }

    // Check if any jobs are tagged with driver ids
    const anyTagged = all.some(
      (j) => j.driverId != null || j.assignedDriverId != null
    );

    // If tagged: filter by current driver.id
    // If not tagged yet (pure mock stage): show ALL jobs as before
    const visibleJobs = anyTagged
      ? all.filter(
          (j) =>
            j.driverId === driver.id || j.assignedDriverId === driver.id
        )
      : all;

    const todayStr = new Date().toISOString().slice(0, 10);

    const todays = visibleJobs.filter(
      (j) => j.pickupDate === todayStr && j.status !== "completed"
    );
    const upcoming = visibleJobs.filter(
      (j) => j.pickupDate > todayStr && j.status !== "completed"
    );

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
          No jobs currently assigned to you in this mock dataset.
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
            {todaysJobs.map((job) => (
              <Link
                key={job.id}
                href={`/driver/jobs/${job.id}`}
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
                    <p>{job.pickupDate}</p>
                    <p className="font-medium">{job.pickupWindow}</p>
                    <p className="mt-1 text-slate-400">
                      {job.totalStops} stops ·{" "}
                      {job.totalBillableWeightKg.toFixed(1)} kg
                    </p>
                    <p className="mt-0.5 text-[10px] text-sky-300">
                      {statusLabel(job.status)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {upcomingJobs.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Upcoming Jobs
          </h2>
          <div className="space-y-3">
            {upcomingJobs.map((job) => (
              <Link
                key={job.id}
                href={`/driver/jobs/${job.id}`}
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
                    <p>{job.pickupDate}</p>
                    <p className="font-medium">{job.pickupWindow}</p>
                    <p className="mt-1 text-slate-400">
                      {job.totalStops} stops ·{" "}
                      {job.totalBillableWeightKg.toFixed(1)} kg
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      Not started
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
