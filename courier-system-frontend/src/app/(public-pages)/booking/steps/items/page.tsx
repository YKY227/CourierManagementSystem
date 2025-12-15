// src/app/(public-pages)/booking/steps/items.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { StepLayout } from "@/components/wizard/StepLayout";
import { FormField } from "@/components/forms/FormField";
import {
  useBooking,
  DeliveryItem,
  ItemCategory,
} from "@/lib/booking-store";
import {
  itemSchema,
  ItemFormSchema,
} from "@/lib/validation/item";

let itemIdCounter = 1;
const nextItemId = () => `I-${itemIdCounter++}`;

type EditingState = {
  deliveryId: string;
  itemId?: string; // present if editing existing
} | null;

const categoryOptions: { id: ItemCategory; label: string }[] = [
  { id: "document", label: "Document" },
  { id: "parcel", label: "Parcel" },
  { id: "fragile", label: "Fragile" },
  { id: "electronics", label: "Electronics" },
  { id: "food", label: "Food / Perishable" },
  { id: "liquid", label: "Liquid" },
  { id: "oversized", label: "Oversized" },
  { id: "other", label: "Other" },
];

// Helper to compute volumetric weight
function computeVolumetricWeight(
  lengthCm: number,
  widthCm: number,
  heightCm: number
) {
  if (!lengthCm || !widthCm || !heightCm) return 0;
  // Standard formula: (L x W x H) / 5000
  return Math.round(((lengthCm * widthCm * heightCm) / 5000) * 100) / 100;
}

function ItemModal({
  editing,
  existingItem,
  onClose,
  onSave,
}: {
  editing: { deliveryId: string; itemId?: string };
  existingItem: DeliveryItem | null;
  onClose: () => void;
  onSave: (item: DeliveryItem) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ItemFormSchema>({
    resolver: zodResolver(itemSchema),
    defaultValues: existingItem
      ? {
          description: existingItem.description,
          category: existingItem.category,
          quantity: existingItem.quantity,
          weightKg: existingItem.weightKg,
          lengthCm: existingItem.lengthCm,
          widthCm: existingItem.widthCm,
          heightCm: existingItem.heightCm,
          remarks: existingItem.remarks ?? "",
          // NEW:
        specialHandling: existingItem.specialHandling ?? false,
        }
      : {
          description: "",
          category: "parcel",
          quantity: 1,
          weightKg: 0,
          lengthCm: 0,
          widthCm: 0,
          heightCm: 0,
          remarks: "",
          specialHandling: false,
        },
  });

  const length = watch("lengthCm") || 0;
  const width = watch("widthCm") || 0;
  const height = watch("heightCm") || 0;
  const volWeight = computeVolumetricWeight(length, width, height);

  const onSubmit = (data: ItemFormSchema) => {
    const id = existingItem?.id ?? nextItemId();
    const updatedItem: DeliveryItem = {
      id,
      deliveryId: editing.deliveryId,
      description: data.description,
      category: data.category,
      quantity: data.quantity,
      weightKg: data.weightKg,
      lengthCm: data.lengthCm,
      widthCm: data.widthCm,
      heightCm: data.heightCm,
      volumetricWeightKg: volWeight,
      remarks: data.remarks ?? "",
      specialHandling: data.specialHandling ?? false,
    };

    onSave(updatedItem);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">
          {editing.itemId ? "Edit Item" : "Add Item"}
        </h2>
        <p className="mb-3 text-[11px] text-slate-500">
          For delivery point{" "}
          <span className="font-mono text-slate-700">
            {editing.deliveryId}
          </span>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Description */}
          <FormField
            label="Item Description"
            required
            error={errors.description?.message}
          >
            <input
              type="text"
              {...register("description")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="e.g. Laptop box, A4 documents, sample products"
            />
          </FormField>

          {/* Category + Quantity */}
          <div className="grid gap-2 md:grid-cols-2">
            <FormField
              label="Category"
              error={errors.category?.message}
            >
              <select
                {...register("category")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Quantity"
              error={errors.quantity?.message}
            >
              <input
                type="number"
                min={1}
                {...register("quantity", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </FormField>
          </div>

          {/* Weight + Dimensions */}
          <div className="grid gap-2 md:grid-cols-2">
            <FormField
              label="Actual Weight (kg)"
              error={errors.weightKg?.message}
            >
              <input
                type="number"
                min={0}
                step={0.1}
                {...register("weightKg", { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </FormField>

            <FormField
              label="Dimensions (cm)"
              error={
                errors.lengthCm?.message ||
                errors.widthCm?.message ||
                errors.heightCm?.message
              }
            >
              <div className="flex gap-1">
                <input
                  type="number"
                  min={0}
                  placeholder="L"
                  {...register("lengthCm", { valueAsNumber: true })}
                  className="w-1/3 rounded-lg border border-slate-200 px-2 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="W"
                  {...register("widthCm", { valueAsNumber: true })}
                  className="w-1/3 rounded-lg border border-slate-200 px-2 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="H"
                  {...register("heightCm", { valueAsNumber: true })}
                  className="w-1/3 rounded-lg border border-slate-200 px-2 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Volumetric weight (L × W × H ÷ 5000):{" "}
                <span className="font-semibold">{volWeight} kg</span>
              </p>
            </FormField>
          </div>

          {/* Remarks */}
          <FormField
            label="Special Handling / Remarks"
            description="Optional"
          >
            <textarea
              rows={2}
              {...register("remarks")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="e.g. Fragile – handle with care, do not stack, keep upright…"
            />
            {/* Special handling checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="specialHandling"
                {...register("specialHandling")}
                className="mt-0.5 h-3 w-3 rounded border-slate-300 text-sky-600 
                          focus:ring-sky-500"
              />
              <label
                htmlFor="specialHandling"
                className="text-[11px] text-slate-700"
              >
                Special handling required (e.g. temperature sensitive, fragile setup,
                on-site unpacking). This may incur additional charges.
              </label>
            </div>

          </FormField>

          {/* Buttons */}
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
            >
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ItemsStep() {
  const router = useRouter();
  const {
    serviceType,
    routeType,
    pickup,
    deliveries,
    items,
    setItems,
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
  }, [serviceType, routeType, pickup, deliveries, router]);

  const [localItems, setLocalItems] = useState<DeliveryItem[]>(() => items);
  const [editing, setEditing] = useState<EditingState>(null);

  const itemsByDelivery = useMemo(() => {
    const map: Record<string, DeliveryItem[]> = {};
    for (const d of deliveries) {
      map[d.id] = [];
    }
    for (const item of localItems) {
      if (!map[item.deliveryId]) map[item.deliveryId] = [];
      map[item.deliveryId].push(item);
    }
    return map;
  }, [deliveries, localItems]);

  const handleRemoveItem = (itemId: string) => {
    setLocalItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleNext = () => {
    if (localItems.length === 0) {
      alert("Please add at least one item before continuing.");
      return;
    }
    setItems(localItems);
    router.push("/booking/steps/schedule");
  };

  const handleBack = () => {
    router.push("/booking/steps/deliveries");
  };

  return (
    <StepLayout
      title="Items per Delivery"
      subtitle="Tell us what you are sending to each delivery point."
      currentStep={5}
      totalSteps={8}
      backHref="/booking/steps/deliveries"
    >
      <div className="space-y-6">
        <div className="space-y-3">
          {deliveries.map((d, index) => {
            const itemsForDelivery = itemsByDelivery[d.id] ?? [];
            return (
              <div
                key={d.id}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">
                      Delivery Point #{index + 1}
                    </h2>
                    <p className="text-xs text-slate-600">
                      {d.addressLine1}
                      {d.addressLine2 ? `, ${d.addressLine2}` : ""} (
                      {d.postalCode})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Recipient: {d.contactName} · {d.contactPhone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing({ deliveryId: d.id })}
                    className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-sky-400 hover:text-sky-700"
                  >
                    + Add Item
                  </button>
                </div>

                {itemsForDelivery.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No items added for this delivery yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {itemsForDelivery.map((item) => {
                      const billable =
                        item.volumetricWeightKg &&
                        item.volumetricWeightKg > item.weightKg
                          ? item.volumetricWeightKg
                          : item.weightKg;

                      return (
                        <div
                          key={item.id}
                          className="flex items-start justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <div className="text-xs">
                            <p className="font-medium text-slate-800">
                              {item.description || "(No description)"}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              Category: {item.category} · Qty: {item.quantity}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              Actual: {item.weightKg || 0} kg · Vol:{" "}
                              {item.volumetricWeightKg || 0} kg · Billable:{" "}
                              {billable || 0} kg
                            </p>

                            {/* ✅ Special handling badge goes here */}
                            {item.specialHandling && (
                              <p className="text-[11px] text-amber-700">
                                ⚠ Special handling required
                              </p>
                            )}


                            {item.remarks && (
                              <p className="text-[11px] text-slate-500">
                                Remarks: {item.remarks}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setEditing({
                                  deliveryId: item.deliveryId,
                                  itemId: item.id,
                                })
                              }
                              className="text-[11px] text-sky-600 hover:text-sky-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-[11px] text-red-500 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="text-xs text-slate-600 hover:text-slate-800"
          >
            ← Back to Delivery Points
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
          >
            Continue to Schedule →
          </button>
        </div>
      </div>

      {/* Modal */}
      {editing && (
        <ItemModal
          editing={editing}
          existingItem={
            editing.itemId
              ? localItems.find((i) => i.id === editing.itemId) ?? null
              : null
          }
          onClose={() => setEditing(null)}
          onSave={(updatedItem) => {
            setLocalItems((prev) => {
              const exists = prev.some((i) => i.id === updatedItem.id);
              if (exists) {
                return prev.map((i) =>
                  i.id === updatedItem.id ? updatedItem : i
                );
              }
              return [...prev, updatedItem];
            });
          }}
        />
      )}
    </StepLayout>
  );
}
