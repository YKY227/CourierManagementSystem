// src/app/(public-pages)/booking/steps/items.tsx
"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StepLayout } from "../../../../components/wizard/StepLayout";
import {
  useBooking,
  DeliveryItem,
  ItemCategory,
  createEmptyItem,
} from "../../../../lib/booking-store";

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
  const [form, setForm] = useState<DeliveryItem | null>(null);

  // When editing changes, initialise form state
  useEffect(() => {
    if (!editing) {
      setForm(null);
      return;
    }
    const { deliveryId, itemId } = editing;

    if (itemId) {
      const existing = localItems.find((i) => i.id === itemId);
      if (existing) {
        setForm({ ...existing });
        return;
      }
    }
    // New item
    setForm(createEmptyItem(nextItemId(), deliveryId));
  }, [editing, localItems]);

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

  const handleItemFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!form) return;
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    setForm((prev) => {
      if (!prev) return prev;
      if (name === "quantity") {
        return { ...prev, [name]: Number(value) || 0 };
      }
      if (name === "weightKg" || name === "lengthCm" || name === "widthCm" || name === "heightCm") {
        return { ...prev, [name]: Number(value) || 0 };
      }
      return { ...prev, [name]: value };
    });
  };

  const computeVolumetricWeight = (lengthCm: number, widthCm: number, heightCm: number) => {
    if (!lengthCm || !widthCm || !heightCm) return 0;
    // Standard formula: (L x W x H) / 5000
    return Math.round(((lengthCm * widthCm * heightCm) / 5000) * 100) / 100;
  };

  const handleSaveItem = (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const vol = computeVolumetricWeight(form.lengthCm, form.widthCm, form.heightCm);
    const updated: DeliveryItem = {
      ...form,
      volumetricWeightKg: vol,
    };

    setLocalItems((prev) => {
      const exists = prev.some((i) => i.id === updated.id);
      if (exists) {
        return prev.map((i) => (i.id === updated.id ? updated : i));
      }
      return [...prev, updated];
    });

    setEditing(null);
  };

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
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">
                      Delivery Point #{index + 1}
                    </h2>
                    <p className="text-xs text-slate-600">
                      {d.addressLine1}
                      {d.addressLine2 ? `, ${d.addressLine2}` : ""} ({d.postalCode})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Recipient: {d.contactName} · {d.contactPhone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({ deliveryId: d.id })
                    }
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
                        item.volumetricWeightKg && item.volumetricWeightKg > item.weightKg
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
                              {item.volumetricWeightKg || 0} kg · Billable: {billable || 0} kg
                            </p>
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

      {/* Simple modal / popup */}
      {editing && form && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              {editing.itemId ? "Edit Item" : "Add Item"}
            </h2>
            <p className="text-[11px] text-slate-500 mb-3">
              For delivery point{" "}
              <span className="font-mono text-slate-700">
                {editing.deliveryId}
              </span>
            </p>

            <form onSubmit={handleSaveItem} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Item Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleItemFormChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="e.g. Laptop box, A4 documents, sample products"
                />
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleItemFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min={1}
                    value={form.quantity}
                    onChange={handleItemFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Actual Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    name="weightKg"
                    value={form.weightKg}
                    onChange={handleItemFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Dimensions (cm)
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={0}
                      name="lengthCm"
                      value={form.lengthCm}
                      onChange={handleItemFormChange}
                      placeholder="L"
                      className="w-1/3 rounded-lg border border-slate-200 px-2 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <input
                      type="number"
                      min={0}
                      name="widthCm"
                      value={form.widthCm}
                      onChange={handleItemFormChange}
                      placeholder="W"
                      className="w-1/3 rounded-lg border border-slate-200 px-2 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <input
                      type="number"
                      min={0}
                      name="heightCm"
                      value={form.heightCm}
                      onChange={handleItemFormChange}
                      placeholder="H"
                      className="w-1/3 rounded-lg border border-slate-200 px-2 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Volumetric weight will be calculated using (L × W × H) ÷ 5000.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Special Handling / Remarks (optional)
                </label>
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleItemFormChange}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="e.g. Fragile – handle with care, do not stack, keep upright…"
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
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
      )}
    </StepLayout>
  );
}
