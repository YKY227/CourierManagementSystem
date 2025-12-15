// src/app/(public-pages)/booking/steps/summary.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { StepLayout } from "@/components/wizard/StepLayout";
import { useBooking } from "@/lib/booking-store";
import { mockEstimatePrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import {
  createJobFromBooking,
  type CreateBookingPayload,
  fetchPricingQuote,
  type PricingQuoteResponse,
} from "@/lib/api/admin";

type BookingStop = NonNullable<CreateBookingPayload["stops"]>[number];

function centsToDollars(cents?: number) {
  return cents && cents > 0 ? formatCurrency(cents / 100) : null;
}


export default function SummaryStep() {
  const router = useRouter();
  const { serviceType, routeType, pickup, deliveries, items, schedule } =
    useBooking();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);



  const isAdHocService = serviceType === "express-3h";
  const hasSpecialHandling = items.some((i) => i.specialHandling);

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
  }, [serviceType, routeType, pickup, deliveries, items, schedule, router,isAdHocService,
    hasSpecialHandling,]);

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

   // Live pricing quote (from backend) – optional, we fall back to mock if it fails
  const [liveQuote, setLiveQuote] = useState<PricingQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Fallback mock pricing (used if backend quote fails or isn't available)
  const fallbackPrice = useMemo(() => {
    if (!serviceType) return 0;
    return mockEstimatePrice({
      distanceKm: mockDistanceKm,
      totalBillableWeightKg: totalBillableWeight,
      stops: deliveries.length,
      serviceType,
    });
  }, [serviceType, totalBillableWeight, deliveries.length]);

  // Use live quote if available; otherwise fallback
  const estimatedPrice =
    liveQuote != null
      ? liveQuote.totalPriceCents / 100
      : fallbackPrice;

  // Fire pricing quote when data is ready
  useEffect(() => {
    if (!serviceType || !schedule || !pickup || deliveries.length === 0) {
      setLiveQuote(null);
      setQuoteError(null);
      return;
    }

    // Primary category: for now, pick first item category or default to "Parcel"
    const primaryCategory =
      (items && items[0]?.category) || "Parcel";

    // Simple pickup datetime: 9am on selected date (SGT)
    const pickupDateTimeIso = schedule.pickupDate
      ? `${schedule.pickupDate}T09:00:00+08:00`
      : new Date().toISOString();

    // Temporary synthetic stops for distance:
    //  - Start at Singapore centroid
    //  - Each delivery roughly 5 km apart along a line
    const baseLat = 1.3521;
    const baseLng = 103.8198;
    const legKm = 5; // pretend each leg is ~5km
    const degreesPerKm = 1 / 111; // approx near equator

    const syntheticStops = [
      { latitude: baseLat, longitude: baseLng, type: "pickup" as const },
      ...deliveries.map((_, index) => {
        const offsetKm = legKm * (index + 1);
        const deltaLat = offsetKm * degreesPerKm;
        return {
          latitude: baseLat + deltaLat,
          longitude: baseLng,
          type: "delivery" as const,
        };
      }),
    ];

    setQuoteLoading(true);
    setQuoteError(null);

    fetchPricingQuote({
      vehicleType: "motorcycle", // for now – we can later map serviceType → vehicle
      itemCategory: primaryCategory,
      actualWeightKg: totalBillableWeight || 0.5,
      pickupDateTime: pickupDateTimeIso,
      stops: syntheticStops,

      isAdHocService,
      hasSpecialHandling,
    })
      .then((quote) => {
        setLiveQuote(quote);
      })
      .catch((err) => {
        console.error(
          "[SummaryStep] Failed to fetch live pricing quote",
          err,
        );
        setLiveQuote(null);
        setQuoteError(
          "Unable to fetch live quote – using prototype estimate instead.",
        );
      })
      .finally(() => {
        setQuoteLoading(false);
      });
  }, [serviceType, schedule, pickup, deliveries, items, totalBillableWeight]);

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

  async function handleConfirm() {
    if (!pickup || !schedule) {
      // Guard — wizard should have redirected earlier, but just in case.
      setSubmitError("Missing pickup or schedule information.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      // Derive a simple customer identity from pickup info
      const customerName =
        pickup.companyName?.trim() ||
        pickup.contactName?.trim() ||
        "Customer";

      // For the prototype, we hard-code region to "central".
      // Later you can derive region from postal code or add a region selector.
      const fallbackRegion = "central";

            const stops: BookingStop[] = [
        // Pickup stop
        {
          type: "pickup",
          label:
            pickup.companyName ||
            pickup.contactName ||
            "Pickup location",
          addressLine:
            [pickup.addressLine1, pickup.addressLine2]
              .filter(Boolean)
              .join(", ") || "Pickup address",
          postalCode: pickup.postalCode || undefined,
          region: fallbackRegion,
          contactName: pickup.contactName || undefined,
          contactPhone: pickup.contactPhone || undefined,
        },
        // Delivery stops
        ...deliveries.map<BookingStop>((d) => ({
          type: "delivery",
          label:
            d.contactName ||
            d.addressLine1 ||
            "Delivery location",
          addressLine:
            [d.addressLine1, d.addressLine2]
              .filter(Boolean)
              .join(", ") || "Delivery address",
          postalCode: d.postalCode || undefined,
          region: fallbackRegion,
          contactName: d.contactName || undefined,
          contactPhone: d.contactPhone || undefined,
        })),
      ];


      // Map wizard state → CreateBookingPayload
      const payload: CreateBookingPayload = {
        customerName,
        customerEmail: pickup.contactEmail || undefined,
        customerPhone: pickup.contactPhone || undefined,
        pickupRegion: fallbackRegion,
        pickupDate: schedule.pickupDate, // already "yyyy-mm-dd"
        pickupSlot: schedule.pickupSlot,
        jobType: "scheduled", // simple prototype – everything scheduled
        serviceType: serviceType ?? undefined,
        routeType: routeType ?? undefined,
        totalBillableWeightKg: totalBillableWeight,
        stops,
      };

      const created = await createJobFromBooking(payload);

      // Redirect to confirmation page FIRST,
      // carrying publicId (or id as fallback) via query string.
      const publicId = created.publicId ?? created.id;
      router.push(
        `/booking/steps/payment?jobId=${encodeURIComponent(publicId)}`
      );
    } catch (err: any) {
      console.error("[SummaryStep] Failed to confirm booking", err);
      setSubmitError(err?.message ?? "Failed to confirm booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StepLayout
      title="Review & Confirm"
      subtitle="Check all details before creating the booking."
      currentStep={7}
      totalSteps={9}
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

          {isAdHocService && (
            <p className="mt-1 text-[11px] text-rose-700">
              ⚡ Ad hoc / Express service
            </p>
          )}

          {hasSpecialHandling && (
            <p className="mt-1 text-[11px] text-amber-700">
              ⚠ Special handling required
            </p>
          )}
        </div>


          {/* Stops / weight card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Stops &amp; Weight
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
              {quoteLoading
                ? "Calculating quote…"
                : formatCurrency(estimatedPrice)}
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              {liveQuote
                ? `Based on estimated route distance ~${liveQuote.totalDistanceKm.toFixed(
                    1,
                  )} km using the pricing engine.`
                : `Based on mock distance of ${mockDistanceKm} km for prototyping.`}
            </p>

            {quoteError && (
              <p className="mt-1 text-[11px] text-amber-600">
                {quoteError}
              </p>
            )}

            {liveQuote?.breakdown && (
            <div className="md:col-span-3 rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pricing Breakdown
              </h2>

              <ul className="space-y-1 text-sm text-slate-700">
                {centsToDollars(liveQuote.breakdown.distanceChargeCents) && (
                  <li className="flex justify-between">
                    <span>Distance charge</span>
                    <span>{centsToDollars(liveQuote.breakdown.distanceChargeCents)}</span>
                  </li>
                )}

                {centsToDollars(liveQuote.breakdown.weightChargeCents) && (
                  <li className="flex justify-between">
                    <span>Weight charge</span>
                    <span>{centsToDollars(liveQuote.breakdown.weightChargeCents)}</span>
                  </li>
                )}

                {centsToDollars(liveQuote.breakdown.categorySurchargeCents) && (
                  <li className="flex justify-between">
                    <span>Category surcharge</span>
                    <span>{centsToDollars(liveQuote.breakdown.categorySurchargeCents)}</span>
                  </li>
                )}

                {centsToDollars(liveQuote.breakdown.multiStopChargeCents) && (
                  <li className="flex justify-between">
                    <span>Additional stops</span>
                    <span>{centsToDollars(liveQuote.breakdown.multiStopChargeCents)}</span>
                  </li>
                )}

                {centsToDollars(liveQuote.breakdown.peakHourSurchargeCents) && (
                  <li className="flex justify-between text-amber-700">
                    <span>Peak hour surcharge</span>
                    <span>{centsToDollars(liveQuote.breakdown.peakHourSurchargeCents)}</span>
                  </li>
                )}

                {centsToDollars(liveQuote.breakdown.adHocServiceFeeCents) && (
                  <li className="flex justify-between text-rose-700">
                    <span>Ad hoc service</span>
                    <span>{centsToDollars(liveQuote.breakdown.adHocServiceFeeCents)}</span>
                  </li>
                )}

                {centsToDollars(liveQuote.breakdown.specialHandlingFeeCents) && (
                  <li className="flex justify-between text-amber-700">
                    <span>Special handling</span>
                    <span>{centsToDollars(liveQuote.breakdown.specialHandlingFeeCents)}</span>
                  </li>
                )}

                <li className="mt-2 flex justify-between border-t pt-2 font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(liveQuote.totalPriceCents / 100)}</span>
                </li>
              </ul>
            </div>
          )}

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
                {pickup?.companyName ||
                  pickup?.contactName ||
                  "Pickup Location"}
              </p>

              <p className="mt-1 text-xs text-slate-700">
                {pickup?.addressLine1}
                {pickup?.addressLine2 ? `, ${pickup.addressLine2}` : ""}
              </p>
              <p className="text-xs text-slate-700">
                {pickup?.postalCode}
              </p>

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
                Deliveries &amp; Items
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
                        No items recorded for this delivery (check Items
                        step).
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

        {/* Error message (if any) */}
        {submitError && (
          <p className="text-xs text-red-600">{submitError}</p>
        )}

        {/* Footer buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleBack}
            className="text-xs text-slate-600 hover:text-slate-800"
            disabled={submitting}
          >
            ← Back to Schedule
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Creating booking…"
              : "Confirm & Make Payment →"}
          </button>
        </div>
      </div>
    </StepLayout>
  );
}
