"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { StepLayout } from "@/components/wizard/StepLayout";
import { FormField } from "@/components/forms/FormField";
import { useBooking, createEmptyPickup } from "@/lib/booking-store";
import { pickupSchema, PickupSchema } from "@/lib/validation/pickup";

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
  } = useForm<PickupSchema>({
    resolver: zodResolver(pickupSchema),
    defaultValues: pickup ?? createEmptyPickup(),
  });

  const onSubmit = (data: PickupSchema) => {
    // Merge with a fully-typed PickupLocation, then override with form values
  const pickupPayload = {
    ...createEmptyPickup(),
    ...data,
  };
    setPickup(pickupPayload);
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
          <FormField
            label="Contact Name"
            htmlFor="contactName"
            required
            error={errors.contactName?.message}
          >
            <input
              id="contactName"
              {...register("contactName")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </FormField>

          <FormField
            label="Contact Phone"
            htmlFor="contactPhone"
            required
            error={errors.contactPhone?.message}
          >
            <input
              id="contactPhone"
              {...register("contactPhone")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>

        <FormField
          label="Email"
          htmlFor="contactEmail"
          error={errors.contactEmail?.message}
          description="Optional"
        >
          <input
            id="contactEmail"
            {...register("contactEmail")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </FormField>

        <FormField
          label="Address Line 1"
          htmlFor="addressLine1"
          required
          error={errors.addressLine1?.message}
        >
          <input
            id="addressLine1"
            {...register("addressLine1")}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Address Line 2"
            htmlFor="addressLine2"
            description="Optional"
          >
            <input
              id="addressLine2"
              {...register("addressLine2")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </FormField>

          <FormField
            label="Postal Code"
            htmlFor="postalCode"
            required
            error={errors.postalCode?.message}
          >
            <input
              id="postalCode"
              {...register("postalCode")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </FormField>
        </div>

        <FormField label="Remarks" htmlFor="remarks">
          <textarea
            id="remarks"
            {...register("remarks")}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </FormField>

        {/* Save as favorite */}
        <div className="flex items-center gap-2">
          <input id="saveAsFavorite" type="checkbox" {...register("saveAsFavorite")} />
          <label htmlFor="saveAsFavorite" className="text-xs text-slate-700">
            Save as favorite location
          </label>
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
