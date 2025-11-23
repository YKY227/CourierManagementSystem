// src/app/(public-pages)/booking/steps/summary.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { StepLayout } from "../../../../components/wizard/StepLayout";
import { useBooking } from "../../../../lib/booking-store";
import { mockEstimatePrice } from "../../../../lib/pricing";
import { formatCurrency } from "../../../../lib/utils";

export default function SummaryStep() {
  const router = useRouter();
  const {
    serviceType,
    routeType,
    pickup,
    deliveries,
    items,
    schedule,
  } = useBooking();

  // 🛡 Wizard guard
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

  const totalBillableWeight = useMemo(() => {
    return items.reduce((sum, item) => {
      const vol = item.volumetricWeightKg || 0;
      const actual = item.weightKg || 0;
      const billablePerUnit = vol > actual ? vol : actual;
      const qty = item.quantity || 1;
      return sum + billablePerUnit * qty;
    }, 0);
  }, [items]);

  // Mock distance for prototype pricing
  const mockDistanceKm = 12;

  const estimatedPrice = useMemo(() => {
    if (!serviceType) return 0;
    return mockEstimatePrice({
      distanceKm: mockDistanceKm,
      totalBillableWeightKg: totalBillableWeight,
      stops: deliveries.length,
      serviceType,
    });
  }, [serviceType, totalBillableWeight, deliveries.length]);

  const serviceLabel =
    serviceType === "same-day"
      ? "Same Day Delivery"
      : serviceType === "next-day"
      ? "Next Day Delivery"
      : serviceType === "express-3h"
      ? "3-Hour Express"
      : "-";

  const routeLabel =
    routeType === "one-to-many"
      ? "One pickup → Many deliveries"
      : routeType === "many-to-one"
      ? "Many pickups → One delivery"
      : routeType === "one-to-one"
      ? "One pickup → One delivery"
      : routeType === "round-trip"
      ? "Round trip / sequence"
      : "-";

  const handleBack = () => {
    router.push("/booking/steps/schedule");
  };

  const handleConfirm = () => {
    // Later this will POST to backend to create a job.
    router.push("/booking/steps/confirmation");
  };

  return (
    <StepLayout
      title="Review & Confirm"
      subtitle="Check all details before creating the booking."
      currentStep={7}
      totalSteps={8}
      backHref="/booking/steps/schedule"
    >
      <div className="space-y-6">
        {/* Top-level summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Service card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Service
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {serviceLabel}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Route: {routeLabel}
            </p>
          </div>

          {/* Stops / weight card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Stops & Weight
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {deliveries.length} delivery point
              {deliveries.length > 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Total billable weight: {totalBillableWeight.toFixed(2)} kg
            </p>
          </div>

          {/* Price card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estimated Charges
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatCurrency(estimatedPrice)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Based on mock distance of {mockDistanceKm} km for prototyping.
            </p>
          </div>
        </div>

        {/* Pickup + deliveries layout */}
        <div className="grid gap-4 md:grid-cols-[1.2fr_1.8fr]">
          {/* Left: pickup + notes */}
          <div className="space-y-3">
            {/* Pickup */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pickup
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

              {schedule && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Pickup on {schedule.pickupDate} · Slot:{" "}
                  {schedule.pickupSlot}
                </p>
              )}

              {pickup?.remarks && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Remarks: {pickup.remarks}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes
              </h2>
              <p className="text-[11px] text-slate-600">
                In a real system, this section can also highlight requested
                delivery windows, restricted zones, surcharges, and SLA
                warnings (e.g. cut-off times).
              </p>
            </div>
          </div>

          {/* Right: deliveries & items */}
          <div className="space-y-3">
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Deliveries & Items
              </h2>

              {deliveries.map((d) => {
                const itemsForDelivery = items.filter(
                  (i) => i.deliveryId === d.id
                );

                return (
                  <div
                    key={d.id}
                    className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
                  >
                    <p className="text-xs font-semibold text-slate-900">
                      {d.addressLine1}
                      {d.addressLine2 ? `, ${d.addressLine2}` : ""} (
                      {d.postalCode})
                    </p>

                    <p className="text-[11px] text-slate-600">
                      Recipient: {d.contactName} · {d.contactPhone}
                    </p>

                    {d.remarks && (
                      <p className="text-[11px] text-slate-500">
                        Delivery remarks: {d.remarks}
                      </p>
                    )}

                    {itemsForDelivery.length === 0 ? (
                      <p className="text-[11px] text-red-500">
                        No items recorded for this delivery (check Items step).
                      </p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {itemsForDelivery.map((item) => {
                          const vol = item.volumetricWeightKg || 0;
                          const actual = item.weightKg || 0;
                          const billable = vol > actual ? vol : actual;
                          const qty = item.quantity || 1;
                          const billableTotal = billable * qty;

                          return (
                            <li
                              key={item.id}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px]"
                            >
                              <span className="font-medium text-slate-800">
                                {item.description || "(No description)"}
                              </span>
                              <span className="ml-1 text-slate-500">
                                · {item.category} · Qty {qty}
                              </span>

                              <div className="mt-0.5 text-slate-600">
                                Actual {actual || 0} kg · Vol {vol || 0} kg ·
                                Billable {billableTotal.toFixed(2)} kg
                              </div>

                              {item.remarks && (
                                <div className="mt-0.5 text-slate-500">
                                  Remarks: {item.remarks}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleBack}
            className="text-xs text-slate-600 hover:text-slate-800"
          >
            ← Back to Schedule
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
          >
            Confirm & Create Booking →
          </button>
        </div>
      </div>
    </StepLayout>
  );
}
