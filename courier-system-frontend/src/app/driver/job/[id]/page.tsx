// src/app/driver/job/[id]/page.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedJobs } from "../../../../lib/unified-jobs-store";
import type { DriverJobStop, RoutePattern } from "@/lib/types";
import { uploadProofPhoto } from "@/lib/api/driver-proof";

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

  const {
    driverJobs: jobs,
    pendingActions,
    loaded,
    markDriverJobStatus: markJobStatus,
    markDriverStopCompleted: markStopCompleted,
  } = useUnifiedJobs();

  const job = useMemo(
    () => jobs.find((j) => j.id === id),
    [jobs, id]
  );

  // ─────────────────────────────────────────────
  // Photo upload local state
  // ─────────────────────────────────────────────
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [uploadingStopId, setUploadingStopId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localProofs, setLocalProofs] = useState<Record<string, string[]>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenFilePicker = (stopId: string) => {
    setActiveStopId(stopId);
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    const file = event.target.files?.[0];
    if (!file || !job || !activeStopId) {
      event.target.value = "";
      return;
    }

    try {
      setUploadingStopId(activeStopId);
      setUploadError(null);

      const proof = await uploadProofPhoto(job.id, file, activeStopId);

      // Store thumbnail locally so driver sees immediate feedback
      setLocalProofs((prev) => ({
        ...prev,
        [activeStopId]: [...(prev[activeStopId] ?? []), proof.url],
      }));
    } catch (err: any) {
      console.error("[DriverJobDetailPage] upload failed", err);
      setUploadError(err?.message ?? "Failed to upload photo.");
    } finally {
      setUploadingStopId(null);
      event.target.value = "";
    }
  };

  // ─────────────────────────────────────────────

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
          This job ID is not in the current dataset.
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
            {job.routePattern && (
              <p className="mt-0.5 text-[10px] text-slate-300">
                Route type: {routePatternLabel(job.routePattern)}
              </p>
            )}
            {hasPendingForJob && (
              <p className="text-[10px] text-amber-300">Pending sync…</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-4">
        {/* Hidden file input shared by all stops */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          // On mobile, many browsers will open camera first for image/*
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

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
              <p className="text-[11px] text-slate-400">{job.areaLabel}</p>
            </div>
            <div className="text-right text-[11px] text-slate-300">
              <p>{job.pickupDate}</p>
              <p className="font-medium">{job.pickupWindow}</p>
              <p className="mt-1 text-slate-400">
                {job.totalStops} stops · {job.totalBillableWeightKg.toFixed(1)}{" "}
                kg
              </p>
            </div>
          </div>

          {/* Driver actions */}
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
              Changes stored locally – will sync when online &amp; connected to
              server.
            </p>
          )}
        </section>

        {/* Stops timeline */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Route &amp; Stops
          </h2>

          <ol className="relative border-l border-slate-700 pl-4">
            {job.stops
              .slice()
              .sort((a, b) => a.sequence - b.sequence)
              .map((stop) => {
                const hasPendingForStop = pendingActions.some(
                  (a) => a.jobId === job.id && a.stopId === stop.id
                );
                const localUrls = localProofs[stop.id] ?? [];

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

                      {/* Existing proofPhotoUrl from backend (latest) */}
                      {stop.proofPhotoUrl && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a
                            href={stop.proofPhotoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={stop.proofPhotoUrl}
                              alt="Proof"
                              className="h-12 w-12 rounded-md border border-slate-700 object-cover"
                            />
                          </a>
                          <span className="self-center text-[10px] text-slate-500">
                            Latest proof from server
                          </span>
                        </div>
                      )}

                      {/* Locally uploaded proofs this session */}
                      {localUrls.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {localUrls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              <img
                                src={url}
                                alt={`Proof ${idx + 1}`}
                                className="h-12 w-12 rounded-md border border-slate-700 object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
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

                        <button
                          type="button"
                          onClick={() => handleOpenFilePicker(stop.id)}
                          disabled={uploadingStopId === stop.id}
                          className="rounded-md border border-slate-600 px-2 py-1 text-[10px] text-slate-100 hover:border-sky-500 disabled:opacity-60"
                        >
                          {uploadingStopId === stop.id
                            ? "Uploading…"
                            : "Take / Upload photo"}
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

          {uploadError && (
            <p className="mt-3 text-[10px] text-red-400">{uploadError}</p>
          )}

          <p className="mt-4 text-[11px] text-slate-500">
            Photos are uploaded to the server as proof of pickup/delivery. In a
            real deployment, customers will be able to see these on the tracking
            page.
          </p>
        </section>
      </main>
    </div>
  );
}
