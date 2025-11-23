"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { StepLayout } from "../../../../components/wizard/StepLayout";
import { FormField } from "../../../../components/forms/FormField";
import {
  useBooking,
  DeliveryPoint,
} from "../../../../lib/booking-store";
import {
  deliveriesSchema,
  DeliveriesFormSchema,
} from "../../../../lib/validation/deliveries";

export default function DeliveriesStep() {
  const router = useRouter();
  const {
    serviceType,
    routeType,
    pickup,
    deliveries,
    setDeliveries,
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
  }, [serviceType, routeType, pickup, router]);

  // Prepare default form values
  const defaultValues: DeliveriesFormSchema = {
    deliveries:
      deliveries && deliveries.length > 0
        ? deliveries.map((d) => ({
            contactName: d.contactName,
            contactPhone: d.contactPhone,
            contactEmail: d.contactEmail,
            addressLine1: d.addressLine1,
            addressLine2: d.addressLine2,
            postalCode: d.postalCode,
            remarks: d.remarks,
            saveAsFavorite: d.saveAsFavorite,
          }))
        : [
            {
              contactName: "",
              contactPhone: "",
              contactEmail: "",
              addressLine1: "",
              addressLine2: "",
              postalCode: "",
              remarks: "",
              saveAsFavorite: true,
            },
          ],
  };

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliveriesFormSchema>({
    resolver: zodResolver(deliveriesSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "deliveries",
  });

  const onAddDelivery = () => {
    append({
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      addressLine1: "",
      addressLine2: "",
      postalCode: "",
      remarks: "",
      saveAsFavorite: true,
    });
  };

  const onSubmit = (data: DeliveriesFormSchema) => {
    const mapped: DeliveryPoint[] = data.deliveries.map((d, index) => {
      const existing = deliveries[index];

      return {
        id: existing?.id ?? `D-${Date.now()}-${index}`,
        contactName: d.contactName,
        contactPhone: d.contactPhone,
        contactEmail: d.contactEmail || "",
        addressLine1: d.addressLine1,
        addressLine2: d.addressLine2 || "",
        postalCode: d.postalCode,
        remarks: d.remarks || "",
        saveAsFavorite: d.saveAsFavorite,
      };
    });

    setDeliveries(mapped);
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
      subtitle={`Specify the delivery locations. Route type: ${routeLabel}`}
      currentStep={4}
      totalSteps={8}
      backHref="/booking/steps/pickup"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, index) => {
          const fieldErrors = errors.deliveries?.[index];

          return (
            <div
              key={field.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">
                  Delivery Point #{index + 1}
                </h2>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="text-xs text-slate-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>

              {/* Recipient */}
              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  label="Recipient Name"
                  required
                  error={fieldErrors?.contactName?.message}
                >
                  <input
                    {...register(`deliveries.${index}.contactName`)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </FormField>

                <FormField
                  label="Recipient Phone"
                  required
                  error={fieldErrors?.contactPhone?.message}
                >
                  <input
                    {...register(`deliveries.${index}.contactPhone`)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </FormField>

                <FormField
                  label="Recipient Email"
                  error={fieldErrors?.contactEmail?.message}
                  description="Optional"
                >
                  <input
                    {...register(`deliveries.${index}.contactEmail`)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </FormField>
              </div>

              {/* Address  */}
              <FormField
                label="Delivery Address Line 1"
                required
                error={fieldErrors?.addressLine1?.message}
              >
                <input
                  {...register(`deliveries.${index}.addressLine1`)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </FormField>

              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Address Line 2" description="Optional">
                  <input
                    {...register(`deliveries.${index}.addressLine2`)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </FormField>

                <FormField
                  label="Postal Code"
                  required
                  error={fieldErrors?.postalCode?.message}
                >
                  <input
                    {...register(`deliveries.${index}.postalCode`)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </FormField>
              </div>

              {/* Remarks */}
              <FormField
                label="Delivery Instructions / Remarks"
                description="Optional"
              >
                <textarea
                  {...register(`deliveries.${index}.remarks`)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </FormField>

              {/* Save as favorite */}
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    {...register(`deliveries.${index}.saveAsFavorite`)}
                  />
                  Save this as a favorite delivery address
                </label>
              </div>
            </div>
          );
        })}

        {/* Add & Continue */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onAddDelivery}
            className="inline-flex items-center rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:border-sky-400 hover:text-sky-700"
          >
            + Add another delivery point
          </button>

        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Continue to Items →
        </button>
        </div>

        {/* Top-level array error */}
        {errors.deliveries && !Array.isArray(errors.deliveries) && (
          <p className="text-[11px] text-red-500">
            {errors.deliveries.message as string}
          </p>
        )}
      </form>
    </StepLayout>
  );
}
