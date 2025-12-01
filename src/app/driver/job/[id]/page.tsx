//src/app/driver/job/[id]/page.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
//import { useDriverJobs } from "../../../../lib/driver-jobs-store";
import { useUnifiedJobs } from "../../../../lib/unified-jobs-store";
//import type { DriverJobStop } from "../../../../lib/mock/driver-jobs";
import type { DriverJobStop } from "@/lib/types";

type JobDetailPageProps = {
  params: { id: string };
};

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

function stopTypeLabel(type: DriverJobStop["type"]) {
  switch (type) {
    case "pickup":
      return "Pickup";
    case "delivery":
      return "Delivery";
    case "return":
      return "Return";
  }
}

export default function DriverJobDetailPage({ params }: JobDetailPageProps) {
  const router = useRouter();
  const { id } = params;

  // const {
  //   jobs,
  //   pendingActions,
  //   loaded,
  //   markJobStatus,
  //   markStopCompleted,
  // } = useDriverJobs();


  const {
  driverJobs: jobs,
  pendingActions,
  loaded,
  markDriverJobStatus:markJobStatus ,        // rename locally if you like
  markDriverStopCompleted: markStopCompleted,
} = useUnifiedJobs();

  const job = useMemo(
    () => jobs.find((j) => j.id === id),
    [jobs, id]
  );

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-xs text-slate-400">
        Loading job…
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
        <button
          type="button"
          onClick={() => router.push("/driver/jobs")}
          className="mb-4 text-xs text-slate-400 hover:text-slate-200"
        >
          ← Back to jobs
        </button>
        <p className="text-sm font-semibold">Job not found</p>
        <p className="mt-1 text-xs text-slate-400">
          This job ID is not in the current offline dataset.
        </p>
      </div>
    );
  }

  const hasPendingForJob = pendingActions.some((a) => a.jobId === job.id);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => router.push("/driver/jobs")}
            className="text-xs text-slate-400 hover:text-slate-100"
          >
            ← Jobs
          </button>
          <div className="text-right">
            <p className="text-[11px] font-mono text-slate-400">
              {job.displayId}
            </p>
            <p className="text-xs font-semibold text-slate-50">
              {statusLabel(job.status)}
            </p>
            {hasPendingForJob && (
              <p className="text-[10px] text-amber-300">Pending sync…</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4 space-y-4">
        {/* Job meta */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Pickup
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
                {job.totalStops} stops · {job.totalBillableWeightKg.toFixed(1)} kg
              </p>
            </div>
          </div>

          {/* Driver actions (offline) */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => markJobStatus(job.id, "pickup")}
              className="flex-1 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700"
            >
              Mark out for pickup
            </button>
            <button
              type="button"
              className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-100 hover:border-sky-500 hover:text-sky-100"
            >
              Open in Maps
            </button>
          </div>

          {hasPendingForJob && (
            <p className="mt-2 text-[10px] text-amber-300">
              Changes stored locally – will sync when online & connected to
              server.
            </p>
          )}
        </section>

        {/* Stops timeline */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Route & Stops
          </h2>

          <ol className="relative border-l border-slate-700 pl-4">
            {job.stops
              .slice()
              .sort((a, b) => a.sequence - b.sequence)
              .map((stop) => {
                const hasPendingForStop = pendingActions.some(
                  (a) => a.jobId === job.id && a.stopId === stop.id
                );
                return (
                  <li key={stop.id} className="mb-5 last:mb-0">
                    <div className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border border-slate-500 bg-slate-900" />
                    <div className="ml-2 text-[11px] text-slate-200">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">
                        {stopTypeLabel(stop.type)} · Stop {stop.sequence}
                      </p>
                      <p className="font-semibold text-slate-50">
                        {stop.label}
                      </p>
                      <p className="text-slate-400">
                        {stop.addressLine1} · S({stop.postalCode})
                      </p>
                      <p className="mt-0.5 text-slate-400">
                        Contact: {stop.contactName} · {stop.contactPhone}
                      </p>
                      {stop.remarks && (
                        <p className="mt-0.5 text-slate-500">
                          Remarks: {stop.remarks}
                        </p>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => markStopCompleted(job.id, stop.id)}
                          className={[
                            "rounded-md border px-2 py-1 text-[10px]",
                            stop.completed
                              ? "border-emerald-400 text-emerald-300"
                              : "border-slate-600 text-slate-100 hover:border-sky-500",
                          ].join(" ")}
                        >
                          {stop.completed ? "Completed" : "Mark completed"}
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-slate-600 px-2 py-1 text-[10px] text-slate-100 hover:border-sky-500"
                        >
                          Call / WhatsApp
                        </button>
                        {hasPendingForStop && (
                          <span className="text-[10px] text-amber-300">
                            Pending sync…
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
          </ol>

          <p className="mt-4 text-[11px] text-slate-500">
            All changes are stored locally so you can continue even if network
            is unstable. When we connect this to the backend, these updates will
            sync to the operations system and customer tracking.
          </p>
        </section>
      </main>
    </div>
  );
}
