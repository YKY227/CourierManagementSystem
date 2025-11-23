// src/app/(public-pages)/booking/steps/pickup.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StepLayout } from "../../../../components/wizard/StepLayout";
import { useBooking, PickupLocation } from "../../../../lib/booking-store";

type PickupFormState = PickupLocation;

export default function PickupStep() {
  const router = useRouter();
  const { serviceType, routeType, pickup, setPickup } = useBooking();

  // 🛡 Wizard guard: must have service + route selected
  useEffect(() => {
    if (!serviceType) {
      router.replace("/booking/steps/delivery-type");
      return;
    }
    if (!routeType) {
      router.replace("/booking/steps/route-type");
    }
  }, [serviceType, routeType, router]);

  const [form, setForm] = useState<PickupFormState>(
    pickup ?? {
      companyName: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      addressLine1: "",
      addressLine2: "",
      postalCode: "",
      remarks: "",
      saveAsFavorite: true,
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as
      | HTMLInputElement
      | HTMLTextAreaElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Save to global booking state
    setPickup(form);

    router.push("/booking/steps/deliveries");
  };

  return (
    <StepLayout
      title="Pickup Location"
      subtitle="Tell us where to collect the items from."
      currentStep={3}
      totalSteps={8}
      backHref="/booking/steps/route-type"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Company / Organisation (optional)
            </label>
            <input
              type="text"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="e.g. STL Logistics Pte Ltd"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Contact Person <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contactName"
              value={form.contactName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Name at pickup location"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={form.contactPhone}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="+65 9XXX XXXX"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Contact Email (optional)
            </label>
            <input
              type="email"
              name="contactEmail"
              value={form.contactEmail}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="for notifications / receipts"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Pickup Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="addressLine1"
            value={form.addressLine1}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Block / Street / Building"
          />
          <input
            type="text"
            name="addressLine2"
            value={form.addressLine2}
            onChange={handleChange}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Unit / Level / Additional details (optional)"
          />
        </div>

        <div className="space-y-1.5 max-w-xs">
          <label className="text-xs font-medium text-slate-700">
            Postal Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="e.g. 123456"
          />
          <p className="text-[11px] text-slate-500">
            We&apos;ll use this to validate the location and estimate distance.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">
            Pickup Instructions / Remarks (optional)
          </label>
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="e.g. Loading bay at back of building, call before arrival, security pass required…"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              name="saveAsFavorite"
              checked={form.saveAsFavorite}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            Save this as a favorite pickup address
          </label>

          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
          >
            Continue to Delivery Points →
          </button>
        </div>
      </form>
    </StepLayout>
  );
}
