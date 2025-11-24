// src/app/(public-pages)/booking/steps/schedule.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { StepLayout } from "@/components/wizard/StepLayout";
import { FormField } from "@/components/forms/FormField";
import { useBooking, ScheduleInfo } from "@/lib/booking-store";

// Helper: return YYYY-MM-DD for <input type="date" />
const todayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ScheduleStep() {
  const router = useRouter();
  const {
    serviceType,
    routeType,
    pickup,
    deliveries,
    items,
    schedule,
    setSchedule,
  } = useBooking();

  // 🛡 Wizard guards
  useEffect(() => {
    if (!serviceType) return router.replace("/booking/steps/delivery-type");
    if (!routeType) return router.replace("/booking/steps/route-type");
    if (!pickup) return router.replace("/booking/steps/pickup");
    if (!deliveries?.length) return router.replace("/booking/steps/deliveries");
    if (!items?.length) return router.replace("/booking/steps/items");
  }, [serviceType, routeType, pickup, deliveries, items, router]);

  // Pickup window presets
  const slotOptions =
    serviceType === "express-3h"
      ? [
          "09:00 – 12:00",
          "10:00 – 13:00",
          "12:00 – 15:00",
          "14:00 – 17:00",
        ]
      : [
          "09:00 – 12:00",
          "12:00 – 15:00",
          "15:00 – 18:00",
          "Anytime 09:00 – 17:30",
        ];

  // Local state
  const [form, setForm] = useState<ScheduleInfo>(() => {
    return (
      schedule ?? {
        pickupDate: todayISO(),
        pickupSlot: slotOptions[0],
      }
    );
  });

  const handleSubmit = () => {
    if (!form.pickupDate || !form.pickupSlot) {
      alert("Please select a pickup date and time slot.");
      return;
    }
    setSchedule(form);
    router.push("/booking/steps/summary");
  };

  const serviceLabel =
    serviceType === "same-day"
      ? "Same Day Delivery"
      : serviceType === "next-day"
      ? "Next Day Delivery"
      : "3-Hour Express";

  return (
    <StepLayout
      title="Pickup Schedule"
      subtitle={`Choose when the courier should collect your items. (${serviceLabel})`}
      currentStep={6}
      totalSteps={8}
      backHref="/booking/steps/items"
    >
      <div className="space-y-6">
        {/* Date + Time */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pickup Date */}
          <FormField label="Pickup Date" required>
            <input
              type="date"
              min={todayISO()}
              value={form.pickupDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, pickupDate: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm 
                         focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Production version will disable weekends & enforce Sameday/Nextday rules.
            </p>
          </FormField>

          {/* Pickup Time */}
          <FormField label="Pickup Time Window" required>
            <div className="grid grid-cols-2 gap-2">
              {slotOptions.map((slot) => {
                const selected = form.pickupSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, pickupSlot: slot }))
                    }
                    className={[
                      "rounded-lg border px-2 py-2 text-[11px] text-left transition",
                      selected
                        ? "border-sky-500 bg-sky-50 text-sky-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:bg-sky-50",
                    ].join(" ")}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Express deliveries use tighter 3-hour windows.
            </p>
          </FormField>
        </div>

        {/* System Note */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600">
          <p>
            <span className="font-semibold">Note:</span> In the real system, slot
            availability is checked against driver capacity & operations load.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/booking/steps/items")}
            className="text-xs text-slate-600 hover:text-slate-800"
          >
            ← Back to Items
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 
                       text-sm font-medium text-white hover:bg-sky-700 
                       focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
          >
            Continue to Review →
          </button>
        </div>
      </div>
    </StepLayout>
  );
}
