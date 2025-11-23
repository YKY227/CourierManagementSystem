// src/app/(public-pages)/booking/steps/delivery-type.tsx
"use client";

import { useRouter } from "next/navigation";
import { StepLayout } from "../../../../components/wizard/StepLayout";
import { useBooking, ServiceType } from "../../../../lib/booking-store";

const serviceOptions: {
  id: ServiceType;
  label: string;
  badge: string;
  description: string;
  details: string;
}[] = [
  {
    id: "same-day",
    label: "Same Day Delivery",
    badge: "09:00 – 17:30",
    description: "Pickup and delivery on the same day within office hours.",
    details: "Best for standard, non-urgent deliveries within the same day.",
  },
  {
    id: "next-day",
    label: "Next Day Delivery",
    badge: "Next working day",
    description: "Pickup today, delivery by the next working day.",
    details: "Ideal for planned shipments with more flexible timelines.",
  },
  {
    id: "express-3h",
    label: "3-Hour Express",
    badge: "Within 3 hours",
    description:
      "Pickup and delivery completed within a 3-hour window on the same day.",
    details:
      "Perfect for urgent or time-critical documents and parcels.",
  },
];

export default function DeliveryTypeStep() {
  const router = useRouter();
  const { serviceType, setServiceType } = useBooking();

  const handleSelect = (id: ServiceType) => {
    setServiceType(id);
    router.push("/booking/steps/route-type");
  };

  return (
    <StepLayout
      title="Choose Delivery Type"
      subtitle="Select how fast you want the delivery to be completed."
      currentStep={1}
      totalSteps={8}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {serviceOptions.map((option) => {
          const isSelected = serviceType === option.id;
          return (
            <button
              key={option.id ?? "none"}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={[
                "flex flex-col items-start rounded-xl border p-4 text-left transition",
                "hover:border-sky-400 hover:shadow-sm",
                isSelected
                  ? "border-sky-500 bg-sky-50"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                {option.badge}
              </span>
              <h2 className="mt-2 text-sm font-semibold text-slate-900">
                {option.label}
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                {option.description}
              </p>
              <p className="mt-2 text-[11px] text-slate-500">{option.details}</p>
              <span className="mt-3 text-xs font-medium text-sky-600">
                {isSelected ? "Selected ✓" : "Select this option →"}
              </span>
            </button>
          );
        })}
      </div>
    </StepLayout>
  );
}
