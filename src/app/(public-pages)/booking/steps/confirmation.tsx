// src/app/(public-pages)/booking/steps/confirmation.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StepLayout } from "../../../../components/wizard/StepLayout";
import { useBooking } from "../../../../lib/booking-store";

function generateFakeJobId(): string {
  const now = new Date();
  const y = now.getFullYear();
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
    resetBooking,
  } = useBooking();

  // If someone lands here directly, gently send them back to start
  useEffect(() => {
    if (!serviceType || !pickup || !deliveries.length || !items.length) {
      // Not a valid completed booking; redirect to start
      router.replace("/booking/steps/delivery-type");
    }
  }, [serviceType, pickup, deliveries, items, router]);

  const [jobId] = useState<string>(() => generateFakeJobId());

  const deliveryCount = deliveries.length;

  const serviceLabel = useMemo(() => {
    switch (serviceType) {
      case "same-day":
        return "Same Day Delivery";
      case "next-day":
        return "Next Day Delivery";
      case "express-3h":
        return "3-Hour Express";
      default:
        return "-";
    }
  }, [serviceType]);

  const handleNewBooking = () => {
    resetBooking();
    router.push("/booking");
  };

  const handleViewTracking = () => {
    router.push(`/tracking/${jobId}`);
  };

  return (
    <StepLayout
      title="Booking Created"
      subtitle="Your courier request has been captured. A driver will be assigned shortly."
      currentStep={8}
      totalSteps={8}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <div className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm">
            ✓
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Booking Successful
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-900">
              Job ID: <span className="font-mono">{jobId}</span>
            </p>
            <p className="mt-1 text-xs text-emerald-800">
              Use this Job ID for any enquiries and to track your courier.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Service
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {serviceLabel}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Route type:{" "}
              {routeType
                ? routeType.replace("-", " ").replace("round", "round ")
                : "-"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pickup
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {pickup?.companyName || pickup?.contactName || "Pickup Location"}
            </p>
            {schedule && (
              <p className="mt-1 text-[11px] text-slate-600">
                {schedule.pickupDate} · {schedule.pickupSlot}
              </p>
            )}
            <p className="mt-1 text-[11px] text-slate-500">
              {pickup?.addressLine1}
              {pickup?.addressLine2 ? `, ${pickup?.addressLine2}` : ""} ·{" "}
              {pickup?.postalCode}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Deliveries
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {deliveryCount} delivery point{deliveryCount > 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              A driver will review the route and proceed according to the
              selected service level.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600">
          <p className="mb-1 font-semibold text-slate-800">
            What happens next?
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              In the real system, our backend (NestJS) would store this booking
              and assign a driver based on capacity and region.
            </li>
            <li>
              You would receive WhatsApp / email notifications with live
              tracking links.
            </li>
            <li>
              The driver app would show this Job ID and allow pickup / drop-off
              updates and proof-of-delivery uploads.
            </li>
          </ol>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleViewTracking}
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:border-sky-400 hover:text-sky-700"
          >
            View Tracking Page →
          </button>
          <button
            type="button"
            onClick={handleNewBooking}
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
          >
            Create Another Booking
          </button>
        </div>
      </div>
    </StepLayout>
  );
}
