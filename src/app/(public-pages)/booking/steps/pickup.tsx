"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { StepLayout } from "../../../../components/wizard/StepLayout";
import { useBooking, createEmptyPickup } from "../../../../lib/booking-store";
import { pickupSchema, PickupSchema } from "../../../../lib/validation/pickup";

export default function PickupStep() {
  const router = useRouter();
  const { serviceType, routeType, pickup, setPickup } = useBooking();

  // Wizard guards
  useEffect(() => {
    if (!serviceType) router.replace("/booking/steps/delivery-type");
    if (!routeType) router.replace("/booking/steps/route-type");
  }, [serviceType, routeType, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<PickupSchema>({
    resolver: zodResolver(pickupSchema),
    defaultValues: pickup ?? createEmptyPickup(),
  });

  const onSubmit = (data: PickupSchema) => {
    setPickup(data);
    router.push("/booking/steps/deliveries");
  };

  return (
    <StepLayout
      title="Pickup Details"
      subtitle="Enter the collection location for your delivery."
      currentStep={3}
      totalSteps={8}
      backHref="/booking/steps/route-type"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Contact name */}
          <div>
            <label className="text-xs font-medium text-slate-700">
              Contact Name *
            </label>
            <input
              {...register("contactName")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            {errors.contactName && (
              <p className="text-[11px] text-red-500">{errors.contactName.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-medium text-slate-700">
              Contact Phone *
            </label>
            <input
              {...register("contactPhone")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            {errors.contactPhone && (
              <p className="text-[11px] text-red-500">{errors.contactPhone.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-medium text-slate-700">
            Email (optional)
          </label>
          <input
            {...register("contactEmail")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          {errors.contactEmail && (
            <p className="text-[11px] text-red-500">{errors.contactEmail.message}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="text-xs font-medium text-slate-700">
            Address Line 1 *
          </label>
          <input
            {...register("addressLine1")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          {errors.addressLine1 && (
            <p className="text-[11px] text-red-500">{errors.addressLine1.message}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-700">
              Address Line 2 (optional)
            </label>
            <input
              {...register("addressLine2")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700">
              Postal Code *
            </label>
            <input
              {...register("postalCode")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            {errors.postalCode && (
              <p className="text-[11px] text-red-500">{errors.postalCode.message}</p>
            )}
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="text-xs font-medium text-slate-700">Remarks</label>
          <textarea
            {...register("remarks")}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>

        {/* Save as favorite */}
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register("saveAsFavorite")} />
          <label className="text-xs text-slate-700">Save as favorite location</label>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/booking/steps/route-type")}
            className="text-xs text-slate-600 hover:text-slate-800"
          >
            ← Back
          </button>

          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Continue →
          </button>
        </div>
      </form>
    </StepLayout>
  );
}
