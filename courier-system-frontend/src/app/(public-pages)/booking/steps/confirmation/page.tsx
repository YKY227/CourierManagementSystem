"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { StepLayout } from "@/components/wizard/StepLayout";
import { useBooking } from "@/lib/booking-store";
import { mockEstimatePrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

type ConfirmationStepProps = {
  searchParams?: {
    jobId?: string;
  };
};

export default function ConfirmationStep({ searchParams }: ConfirmationStepProps) {
  const router = useRouter();
  const {
    serviceType,
    routeType,
    pickup,
    deliveries,
    items,
    schedule,
    resetBooking,
  } = useBooking();

  // ✅ Real jobId from backend (publicId passed via query string)
  const jobId = searchParams?.jobId;

  // 🛡 Guard: if user lands here without a jobId, send them back
  useEffect(() => {
    if (!jobId) {
      router.replace("/booking/steps/summary");
      return;
    }

    // Optional: also ensure wizard data exists (in case of hard refresh)
    if (
      !serviceType ||
      !routeType ||
      !pickup ||
      !deliveries ||
      deliveries.length === 0 ||
      !items ||
      items.length === 0 ||
      !schedule
    ) {
      router.replace("/booking/steps/delivery-type");
    }
  }, [
    jobId,
    serviceType,
    routeType,
    pickup,
    deliveries,
    items,
    schedule,
    router,
  ]);

  // ─────────────────────────────────────────────
  // Reuse pricing & weight logic for recap
  // ─────────────────────────────────────────────

  const totalBillableWeight = useMemo(() => {
    if (!items) return 0;
    return items.reduce((sum, item) => {
      const vol = item.volumetricWeightKg || 0;
      const actual = item.weightKg || 0;
      const billablePerUnit = vol > actual ? vol : actual;
      const qty = item.quantity || 1;
      return sum + billablePerUnit * qty;
    }, 0);
  }, [items]);

  const mockDistanceKm = 12;

  const estimatedPrice = useMemo(() => {
    if (!serviceType) return 0;
    return mockEstimatePrice({
      distanceKm: mockDistanceKm,
      totalBillableWeightKg: totalBillableWeight,
      stops: deliveries?.length ?? 0,
      serviceType,
    });
  }, [serviceType, totalBillableWeight, deliveries?.length]);

  const serviceLabel =
    serviceType === "same-day"
      ? "Same Day Delivery"
      : serviceType === "next-day"
      ? "Next Day Delivery"
      : serviceType === "express-3h"
      ? "3-Hour Express"
      : "-";

  const handleNewBooking = () => {
    // Reset wizard + start fresh
    resetBooking();
    router.push("/booking/steps/delivery-type");
  };

  const handleTrackJob = () => {
    if (!jobId) return;
    // ✅ Now use real backend publicId
    router.push(`/tracking/${encodeURIComponent(jobId)}`);
  };

  return (
    <StepLayout
      title="Booking Created"
      subtitle="Your courier request has been submitted to the operations team."
      currentStep={9}
      totalSteps={9}
      backHref="/booking/steps/summary"
    >
      <div className="space-y-6">
        {/* Success banner */}
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-emerald-500 text-center text-sm font-semibold text-white">
            ✓
          </div>
          <div className="text-sm text-emerald-900">
            <p className="font-semibold">
              Booking submitted successfully.
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-900/80">
              Our team will check delivery capacity and confirm the slot. 
              You&apos;ll be contacted if any rescheduling is required.
            </p>
          </div>
        </div>

        {/* Job ID + key info */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Job ID
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {jobId ?? "—"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Use this ID when you contact support or check the job status.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Service & Schedule
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {serviceLabel}
            </p>
            {schedule && (
              <p className="mt-1 text-[11px] text-slate-500">
                Pickup on{" "}
                <span className="font-medium">{schedule.pickupDate}</span> ·{" "}
                Slot:{" "}
                <span className="font-medium">{schedule.pickupSlot}</span>
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Summary
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {deliveries?.length ?? 0} delivery point
              {deliveries && deliveries.length > 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Est. charges:{" "}
              <span className="font-semibold">
                {formatCurrency(estimatedPrice)}
              </span>
              <br />
              Billable weight: {totalBillableWeight.toFixed(2)} kg
            </p>
          </div>
        </div>

        {/* Brief recap of pickup + first few stops */}
        <div className="grid gap-4 md:grid-cols-[1.3fr_1.7fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pickup Location
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {pickup?.companyName || pickup?.contactName || "Pickup Location"}
            </p>
            <p className="mt-1 text-xs text-slate-700">
              {pickup?.addressLine1}
              {pickup?.addressLine2 ? `, ${pickup.addressLine2}` : ""}
            </p>
            <p className="text-xs text-slate-700">{pickup?.postalCode}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Contact: {pickup?.contactName} · {pickup?.contactPhone}
            </p>
            {pickup?.remarks && (
              <p className="mt-1 text-[11px] text-slate-500">
                Remarks: {pickup.remarks}
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Delivery Overview
            </h2>
            {deliveries?.slice(0, 3).map((d) => (
              <div
                key={d.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px]"
              >
                <p className="font-semibold text-slate-900">
                  {d.addressLine1}
                  {d.addressLine2 ? `, ${d.addressLine2}` : ""} ({d.postalCode})
                </p>
                <p className="text-slate-600">
                  Recipient: {d.contactName} · {d.contactPhone}
                </p>
                {d.remarks && (
                  <p className="mt-0.5 text-slate-500">
                    Delivery remarks: {d.remarks}
                  </p>
                )}
              </div>
            ))}
            {deliveries && deliveries.length > 3 && (
              <p className="text-[11px] text-slate-500">
                + {deliveries.length - 3} more delivery point
                {deliveries.length - 3 > 1 ? "s" : ""} in this job.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="text-[11px] text-slate-500">
            STL team will assign a driver and update you on any changes to the
            schedule. You can track the status of this job using the Job ID
            above.
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTrackJob}
              disabled={!jobId}
              className="inline-flex items-center rounded-lg border border-sky-600 px-4 py-2 text-xs font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
            >
              Track this job →
            </button>

            <button
              type="button"
              onClick={handleNewBooking}
              className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              + Book another job
            </button>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
