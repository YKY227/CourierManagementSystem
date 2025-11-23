// src/app/(public-pages)/booking/steps/schedule.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StepLayout } from "../../../../components/wizard/StepLayout";
import { useBooking, ScheduleInfo } from "../../../../lib/booking-store";

function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  }, [serviceType, routeType, pickup, deliveries, items, router]);

  // Define mock slots based on service type
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

  const [form, setForm] = useState<ScheduleInfo>(() => {
    return (
      schedule ?? {
        pickupDate: todayISO(),
        pickupSlot: slotOptions[0],
      }
    );
  });

  const handleChangeDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      pickupDate: e.target.value,
    }));
  };

  const handleSelectSlot = (slot: string) => {
    setForm((prev) => ({
      ...prev,
      pickupSlot: slot,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.pickupDate || !form.pickupSlot) {
      alert("Please select a pickup date and time slot.");
      return;
    }
    setSchedule(form);
    router.push("/booking/steps/summary");
  };

  const serviceLabel = (() => {
    switch (serviceType) {
      case "same-day":
        return "Same Day Delivery";
      case "next-day":
        return "Next Day Delivery";
      case "express-3h":
        return "3-Hour Express";
      default:
        return "";
    }
  })();

  return (
    <StepLayout
      title="Pickup Schedule"
      subtitle={`Choose when the courier should collect your items. (${serviceLabel})`}
      currentStep={6}
      totalSteps={8}
      backHref="/booking/steps/items"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">
              Pickup Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={todayISO()}
              value={form.pickupDate}
              onChange={handleChangeDate}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <p className="text-[11px] text-slate-500">
              For prototyping, this is a simple date picker. In production, you
              can limit to working days and enforce same-day / next-day rules.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">
              Pickup Time Window <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {slotOptions.map((slot) => {
                const selected = form.pickupSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSelectSlot(slot)}
                    className={[
                      "rounded-lg border px-2 py-2 text-[11px] text-left transition",
                      "hover:border-sky-400 hover:bg-sky-50",
                      selected
                        ? "border-sky-500 bg-sky-50 text-sky-800"
                        : "border-slate-200 bg-white text-slate-700",
                    ].join(" ")}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              Express 3-hour deliveries require a tighter window; normal
              services allow broader time bands.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-[11px] text-slate-600">
          <p>
            <span className="font-semibold">Note:</span> In the real system,
            available slots would be checked against driver capacity and
            operating hours. Fully booked slots would be disabled automatically.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/booking/steps/items")}
            className="text-xs text-slate-600 hover:text-slate-800"
          >
            ← Back to Items
          </button>
          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
          >
            Continue to Review →
          </button>
        </div>
      </form>
    </StepLayout>
  );
}
