// src/app/admin/jobs/completed/page.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

import type { JobSummary } from "@/lib/types";
import {
  fetchAdminJobs,
  fetchAdminCompletedJobDetail,
  type AdminJobDetailDto,
} from "@/lib/api/admin";

function regionLabel(region: string) {
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

function jobTypeBadge(type: JobSummary["jobType"]) {
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
    <span className={`${base} bg-amber-50 text-amber-700 ring-1 ring-amber-100`}>
      Ad-hoc / Urgent
    </span>
  );
}

function statusBadge(status: JobSummary["status"]) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium";
  switch (status) {
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
        <span className={`${base} bg-red-50 text-red-700 ring-1 ring-red-200`}>
          Failed
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

export default function CompletedJobsPage() {
  // 🔹 Local state instead of useUnifiedJobs
  const [completedJobs, setCompletedJobs] = useState<JobSummary[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminJobDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // 🔹 Fetch completed jobs from backend once on mount
  useEffect(() => {
    async function load() {
      setJobsLoading(true);
      setJobsError(null);
      try {
        const jobs = await fetchAdminJobs("completed"); // hits /api/backend/admin/jobs?status=completed
        setCompletedJobs(jobs);
      } catch (e: any) {
        console.error("[CompletedJobsPage] Failed to load completed jobs", e);
        setJobsError(e?.message ?? "Failed to load completed jobs");
      } finally {
        setJobsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return completedJobs;

    return completedJobs.filter((j) =>
      [j.publicId, j.customerName, j.pickupRegion, j.jobType]
        .filter(Boolean)
        .some((val) => val!.toString().toLowerCase().includes(q)),
    );
  }, [completedJobs, search]);

  const top5 = filtered.slice(0, 5);

  const handleOpenDetail = async (job: JobSummary) => {
    setSelectedJobId(job.id);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const data = await fetchAdminCompletedJobDetail(job.id);
      setDetail(data);
    } catch (err: any) {
      console.error("Failed to load job detail", err);
      setDetailError(err?.message ?? "Failed to load job detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedJobId(null);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Completed Jobs &amp; Proof of Delivery
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Search past completed jobs, inspect details, and view proof photos
              captured by drivers.
            </p>
          </div>
          <Link
            href="/admin/jobs"
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            ← Back to jobs overview
          </Link>
        </header>

        {/* Search bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job ID, customer, region…"
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          {/* later: date range, region dropdown, "has proof" toggle */}
        </div>

        {jobsLoading && (
          <p className="mb-4 text-xs text-slate-500">Loading completed jobs…</p>
        )}
        {jobsError && (
          <p className="mb-4 text-xs text-red-600">{jobsError}</p>
        )}

        {/* Top 5 section */}
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Most recent completed (top 5)
            </h2>
            <p className="text-xs text-slate-500">
              Showing {top5.length} of {filtered.length} completed jobs.
            </p>
          </div>

          {top5.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-xs text-slate-500">
              No completed jobs match your filters.
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
                    <th className="px-3 py-2 text-right font-medium text-slate-600">
                      POD
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {top5.map((job) => {
                    const weight =
                      typeof job.totalBillableWeightKg === "number"
                        ? job.totalBillableWeightKg
                        : Number(job.totalBillableWeightKg ?? 0);

                    const hasProofUnknown = true; // placeholder

                    return (
                      <tr
                        key={job.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleOpenDetail(job)}
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="font-mono text-[11px] text-slate-800">
                            {job.publicId}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {statusBadge(job.status)}
                            {jobTypeBadge(job.jobType)}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-xs font-medium text-slate-900">
                            {job.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {weight.toFixed(1)} kg · {job.stopsCount} stops
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
                        <td className="px-3 py-2 align-top text-right text-[11px] text-slate-500">
                          {hasProofUnknown ? (
                            <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5">
                              📷
                              <span className="ml-1">View</span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* All completed jobs list (same columns, just more rows) */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              All completed jobs (filtered)
            </h2>
            <p className="text-xs text-slate-500">
              {filtered.length} job{filtered.length === 1 ? "" : "s"} found
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-xs text-slate-500">
              No completed jobs match your filters.
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
                      Status
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((job) => {
                    const weight =
                      typeof job.totalBillableWeightKg === "number"
                        ? job.totalBillableWeightKg
                        : Number(job.totalBillableWeightKg ?? 0);

                    return (
                      <tr
                        key={job.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleOpenDetail(job)}
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="font-mono text-[11px] text-slate-800">
                            {job.publicId}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            Source: {job.source ?? "N/A"}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="text-xs font-medium text-slate-900">
                            {job.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {weight.toFixed(1)} kg · {job.stopsCount} stops
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
                          {statusBadge(job.status)}
                        </td>
                        <td className="px-3 py-2 align-top text-right">
                          <button
                            type="button"
                            className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] text-slate-700 hover:border-sky-500 hover:text-sky-700"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Detail modal */}
      {selectedJobId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Job details &amp; proof of delivery
              </h2>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                Close ✕
              </button>
            </div>

            {detailLoading && (
              <p className="text-xs text-slate-500">Loading details…</p>
            )}
            {detailError && (
              <p className="text-xs text-red-600">{detailError}</p>
            )}

            {detail && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Summary + stops */}
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-[11px] text-slate-700">
                          {detail.job.publicId}
                        </p>
                        <p className="text-xs font-semibold text-slate-900">
                          {detail.job.customerName}
                        </p>
                      </div>
                      <div className="text-right">
                        {statusBadge(detail.job.status as any)}
                        <div className="mt-1 text-[10px] text-slate-500">
                          {jobTypeBadge(detail.job.jobType as any)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-600">
                      <p>
                        Pickup: {detail.job.pickupDate} ·{" "}
                        {detail.job.pickupSlot}
                      </p>
                      <p>
                        Region: {regionLabel(detail.job.pickupRegion)} ·{" "}
                        {detail.job.stopsCount} stops
                      </p>
                      {detail.job.driverName && (
                        <p className="mt-1">
                          Driver: {detail.job.driverName}{" "}
                          {detail.job.driverPhone && (
                            <span className="text-slate-500">
                              · {detail.job.driverPhone}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-[11px]">
                    <h3 className="mb-2 text-xs font-semibold text-slate-800">
                      Route &amp; stops
                    </h3>
                    {detail.stops.length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        No stops recorded for this job.
                      </p>
                    ) : (
                      <ol className="relative border-l border-slate-200 pl-4">
                        {detail.stops
                          .slice()
                          .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
                          .map((stop) => (
                            <li key={stop.id} className="mb-4 last:mb-0">
                              <div className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border border-slate-300 bg-white" />
                              <div className="ml-2">
                                <p className="text-[10px] uppercase tracking-wide text-slate-500">
                                  {stop.type.toUpperCase()} · Stop{" "}
                                  {stop.sequenceIndex + 1}
                                </p>
                                <p className="text-[11px] font-semibold text-slate-900">
                                  {stop.label}
                                </p>
                                <p className="text-[11px] text-slate-600">
                                  {stop.addressLine}{" "}
                                  {stop.postalCode &&
                                    `· S(${stop.postalCode})`}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {stop.contactName && (
                                    <>
                                      Contact: {stop.contactName}
                                      {stop.contactPhone &&
                                        ` · ${stop.contactPhone}`}
                                    </>
                                  )}
                                </p>
                                {stop.completedAt && (
                                  <p className="mt-0.5 text-[10px] text-emerald-600">
                                    Completed at{" "}
                                    {new Date(
                                      stop.completedAt,
                                    ).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                      </ol>
                    )}
                  </div>
                </div>

                {/* Proof photos */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-[11px]">
                  <h3 className="mb-2 text-xs font-semibold text-slate-800">
                    Proof of delivery photos
                  </h3>

                  {detail.proofPhotos.length === 0 ? (
                    <p className="text-[11px] text-slate-500">
                      No proof photos were captured for this job.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {detail.proofPhotos.map((photo) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() =>
                            window.open(photo.url, "_blank", "noopener")
                          }
                          className="group relative"
                        >
                          <img
                            src={photo.url}
                            alt="Proof"
                            className="h-20 w-full rounded-md border border-slate-200 object-cover group-hover:border-sky-500"
                          />
                          <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[9px] text-white">
                            {new Date(photo.takenAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {detail.proofPhotos.length > 0 && (
                    <p className="mt-2 text-[10px] text-slate-500">
                      Click any thumbnail to open the full-size image in a new
                      tab. In a future iteration, this can be replaced with a
                      lightbox viewer.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
