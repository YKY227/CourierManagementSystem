// src/app/(public-pages)/booking/steps/deliveries.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StepLayout } from "../../../../components/wizard/StepLayout";
import {
  useBooking,
  DeliveryPoint,
  createEmptyDelivery,
} from "../../../../lib/booking-store";

let idCounter = 1;
const nextId = () => `D-${idCounter++}`;

export default function DeliveriesStep() {
  const router = useRouter();
  const { serviceType, routeType, pickup, deliveries, setDeliveries } =
    useBooking();

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
  }, [serviceType, routeType, pickup, router]);

  const [localDeliveries, setLocalDeliveries] = useState<DeliveryPoint[]>(() => {
    if (deliveries && deliveries.length > 0) return deliveries;
    // Start with one blank delivery
    return [createEmptyDelivery(nextId())];
  });

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as
      | HTMLInputElement
      | HTMLTextAreaElement;
    setLocalDeliveries((prev) =>
      prev.map((d, i) =>
        i === index
          ? {
              ...d,
              [name]: type === "checkbox" ? checked : value,
            }
          : d
      )
    );
  };

  const handleAddDelivery = () => {
    setLocalDeliveries((prev) => [
      ...prev,
      createEmptyDelivery(nextId()),
    ]);
  };

  const handleRemoveDelivery = (index: number) => {
    setLocalDeliveries((prev) => {
      if (prev.length === 1) return prev; // keep at least one
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Basic validation: ensure all deliveries have at least address + postal + contact
    const invalid = localDeliveries.some(
      (d) =>
        !d.addressLine1.trim() ||
        !d.postalCode.trim() ||
        !d.contactName.trim() ||
        !d.contactPhone.trim()
    );

    if (invalid) {
      alert(
        "Please fill in at least contact name, phone, address and postal code for each delivery point."
      );
      return;
    }

    setDeliveries(localDeliveries);
    router.push("/booking/steps/items");
  };

  const routeLabel = (() => {
    switch (routeType) {
      case "one-to-many":
        return "One pickup → Many deliveries";
      case "many-to-one":
        return "Many pickups → One delivery";
      case "one-to-one":
        return "One pickup → One delivery";
      case "round-trip":
        return "Round trip / sequence";
      default:
        return "";
    }
  })();

  return (
    <StepLayout
      title="Delivery Points"
      subtitle={`Define where the items will be delivered. Route type: ${routeLabel}`}
      currentStep={4}
      totalSteps={8}
      backHref="/booking/steps/pickup"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {localDeliveries.map((d, index) => (
          <div
            key={d.id}
            className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                Delivery Point #{index + 1}
              </h2>
              <button
                type="button"
                onClick={() => handleRemoveDelivery(index)}
                disabled={localDeliveries.length === 1}
                className="text-xs text-slate-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={d.contactName}
                  onChange={(e) => handleChange(index, e)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="Who will receive the parcel?"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Recipient Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={d.contactPhone}
                  onChange={(e) => handleChange(index, e)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="+65 8XXX XXXX"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Recipient Email (optional)
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={d.contactEmail}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="For delivery notifications"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="addressLine1"
                value={d.addressLine1}
                onChange={(e) => handleChange(index, e)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Block / Street / Building"
              />
              <input
                type="text"
                name="addressLine2"
                value={d.addressLine2}
                onChange={(e) => handleChange(index, e)}
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
                value={d.postalCode}
                onChange={(e) => handleChange(index, e)}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="e.g. 654321"
              />
              <p className="text-[11px] text-slate-500">
                Used to validate location and estimate distance.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Delivery Instructions / Remarks (optional)
              </label>
              <textarea
                name="remarks"
                value={d.remarks}
                onChange={(e) => handleChange(index, e)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="e.g. Leave at reception, call before arrival, guard house, etc."
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  name="saveAsFavorite"
                  checked={d.saveAsFavorite}
                  onChange={(e) => handleChange(index, e)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Save this as a favorite delivery address
              </label>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddDelivery}
            className="inline-flex items-center rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:border-sky-400 hover:text-sky-700"
          >
            + Add another delivery point
          </button>

          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
          >
            Continue to Items →
          </button>
        </div>
      </form>
    </StepLayout>
  );
}
