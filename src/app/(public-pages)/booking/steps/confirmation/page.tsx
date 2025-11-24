"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { StepLayout } from "@/components/wizard/StepLayout";
import { useBooking } from "@/lib/booking-store";
import { mockEstimatePrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

// Simple helper to generate a fake job ID on the fly
function generateFakeJobId() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `STL-${y}${m}${d}-${rand}`;
}

export default function ConfirmationStep() {
  const router = useRouter();
  const {
    serviceType,
    routeType,
    pickup,
    deliveries,
    items,
    schedule,
  } = useBooking();

  // 🛡 Guard: if user jumps here without going through wizard, send back
  useEffect(() => {
    if (!serviceType) {
      router.replace("/booking/steps/delivery-type");
      return;
    }
    if (!routeType) {
      router.replace("/booking/steps/route-type");
      return;
    }
    if (!pickup) {
      router.replace("/booking/steps/pickup");
      return;
    }
    if (!deliveries || deliveries.length === 0) {
      router.replace("/booking/steps/deliveries");
      return;
    }
    if (!items || items.length === 0) {
      router.replace("/booking/steps/items");
      return;
    }
    if (!schedule) {
      router.replace("/booking/steps/schedule");
      return;
    }
  }, [serviceType, routeType, pickup, deliveries, items, schedule, router]);

  // 🎫 Fake job ID (just for prototype)
  const jobId = useMemo(() => generateFakeJobId(), []);

  // Reuse the same billable weight logic
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
    // Later: you might also reset the booking store here.
    router.push("/booking/steps/delivery-type");
  };

  const handleTrackJob = () => {
    // Prototype: send user to tracking page with this fake jobId
    router.push(`/tracking/${jobId}`);
  };

  return (
    <StepLayout
      title="Booking Created"
      subtitle="Your courier request has been submitted to the operations team."
      currentStep={8}
      totalSteps={8}
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
              {jobId}
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
                Pickup on <span className="font-medium">{schedule.pickupDate}</span> ·{" "}
                Slot: <span className="font-medium">{schedule.pickupSlot}</span>
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

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
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
              className="inline-flex items-center rounded-lg border border-sky-600 px-4 py-2 text-xs font-medium text-sky-700 hover:bg-sky-50"
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
