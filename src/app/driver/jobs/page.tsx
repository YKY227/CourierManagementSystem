"use client";

import Link from "next/link";
//import { useDriverJobs } from "../../../lib/driver-jobs-store";
import { useUnifiedJobs } from "../../../lib/unified-jobs-store";


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

function statusBadgeClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pickup":
    case "in-progress":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "allocated":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "booked":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function DriverJobsPage() {
  const { driverJobs: jobs, pendingActions, loaded } = useUnifiedJobs();
  const todayLabel = "Today"; // later: format new Date()

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-xs text-slate-400">
        Loading jobs…
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">
            My Jobs – {todayLabel}
          </h2>
          <p className="text-[11px] text-slate-400">
            Data cached locally · Works offline
          </p>
        </div>
        {pendingActions.length > 0 && (
          <div className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300">
            {pendingActions.length} pending sync
          </div>
        )}
      </div>

      <div className="space-y-3">
        {jobs.map((job) => {
          const hasPendingForJob = pendingActions.some(
            (a) => a.jobId === job.id
          );

          return (
            <Link
              key={job.id}
              href={`/driver/job/${job.id}`}
              className="block rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm transition hover:border-sky-500 hover:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-mono text-slate-400">
                    {job.displayId}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-50">
                    {job.originLabel}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Area: {job.areaLabel}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      statusBadgeClass(job.status),
                    ].join(" ")}
                  >
                    {statusLabel(job.status)}
                  </span>
                  {hasPendingForJob && (
                    <p className="mt-1 text-[10px] text-amber-300">
                      Pending sync…
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div>
                  <p className="text-slate-400">Pickup</p>
                  <p className="font-medium">
                    {job.pickupDate} · {job.pickupWindow}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Stops / Weight</p>
                  <p className="font-medium">
                    {job.totalStops} stops ·{" "}
                    {job.totalBillableWeightKg.toFixed(1)} kg
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  Tap to view route & stops →
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-200">
                  View job
                </span>
              </div>
            </Link>
          );
        })}

        {jobs.length === 0 && (
          <p className="text-center text-xs text-slate-500">
            No jobs assigned for today.
          </p>
        )}
      </div>
    </div>
  );
}
