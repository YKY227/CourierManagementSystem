"use client";

import { useMemo } from "react";
//import { useDriverJobs } from "../../../lib/driver-jobs-store";
import { useUnifiedJobs } from "../../../lib/unified-jobs-store";

export default function DriverHistoryPage() {
  const {
  driverJobs: jobs,
  pendingActions,
  loaded,
  markDriverJobStatus,
  markDriverStopCompleted,
} = useUnifiedJobs();


  const { completed, active } = useMemo(() => {
    const completedJobs = jobs.filter((j) => j.status === "completed");
    const activeJobs = jobs.filter((j) => j.status !== "completed");
    return { completed: completedJobs, active: activeJobs };
  }, [jobs]);

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-xs text-slate-400">
        Loading history…
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-50">Job History</h2>
        <p className="text-[11px] text-slate-400">
          Prototype view using locally cached jobs. Later this can filter by date
          range and query backend history.
        </p>
      </header>

      {/* Active / recent jobs */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Active / Recent
        </h3>
        {active.length === 0 ? (
          <p className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-400">
            No active jobs at the moment.
          </p>
        ) : (
          <div className="space-y-2">
            {active.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px]"
              >
                <p className="font-mono text-slate-400">{job.displayId}</p>
                <p className="text-slate-50">{job.originLabel}</p>
                <p className="text-slate-400">
                  {job.pickupDate} · {job.pickupWindow}
                </p>
                <p className="text-slate-500">
                  {job.totalStops} stops · {job.totalBillableWeightKg.toFixed(1)} kg
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Status: {job.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed jobs */}
      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Completed
        </h3>
        {completed.length === 0 ? (
          <p className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-400">
            No completed jobs in this prototype dataset yet.
          </p>
        ) : (
          <div className="space-y-2">
            {completed.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-emerald-900 bg-slate-900/70 px-3 py-2 text-[11px]"
              >
                <p className="font-mono text-emerald-300">{job.displayId}</p>
                <p className="text-slate-50">{job.originLabel}</p>
                <p className="text-slate-400">
                  {job.pickupDate} · {job.pickupWindow}
                </p>
                <p className="text-slate-500">
                  {job.totalStops} stops · {job.totalBillableWeightKg.toFixed(1)} kg
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-300">
                  Completed (offline data)
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
