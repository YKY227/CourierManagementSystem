// src/app/admin/drivers/page.tsx
"use client";

import { useState } from "react";
import { Driver, RegionCode, VehicleType } from "@/lib/types";
import {
  mockDrivers,
  REGION_LABELS,
  VEHICLE_LABELS,
} from "@/lib/mock/drivers";

type FormMode = "create" | "edit";

type EditableDriver = Omit<Driver, "id"> & { id?: string };

const REGION_OPTIONS: RegionCode[] = [
  "central",
  "east",
  "west",
  "north",
  "north-east",
  "island-wide",
];

const VEHICLE_OPTIONS: VehicleType[] = ["bike", "car", "van", "lorry", "other"];

function emptyDriver(): EditableDriver {
  return {
    id: undefined,
    code: "",
    name: "",
    email: "",
    phone: "",
    primaryRegion: "central",
    secondaryRegions: [],
    vehicleType: "bike",
    isActive: true,
    maxJobsPerDay: 20,
    maxJobsPerSlot: 6,
    workDayStartHour: 8,
    workDayEndHour: 18,
    notes: "",
    authUserId: undefined,
  };
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const [mode, setMode] = useState<FormMode | null>(null);
  const [formState, setFormState] = useState<EditableDriver | null>(null);

  const openCreate = () => {
    setMode("create");
    setFormState(emptyDriver());
  };

  const openEdit = (driver: Driver) => {
    setMode("edit");
    setFormState({ ...driver });
  };

  const closeForm = () => {
    setMode(null);
    setFormState(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!formState) return;
    const { name, value, type, checked } = e.target;

    setFormState((prev) => {
      if (!prev) return prev;

      // Checkbox for isActive
      if (name === "isActive" && type === "checkbox") {
        return { ...prev, isActive: checked };
      }

      // Number inputs
      if (
        name === "maxJobsPerDay" ||
        name === "maxJobsPerSlot" ||
        name === "workDayStartHour" ||
        name === "workDayEndHour"
      ) {
        return { ...prev, [name]: Number(value) || 0 };
      }

      // Everything else
      return { ...prev, [name]: value };
    });
  };

  const toggleSecondaryRegion = (region: RegionCode) => {
    if (!formState) return;
    setFormState((prev) => {
      if (!prev) return prev;
      const current = prev.secondaryRegions ?? [];
      const exists = current.includes(region);
      return {
        ...prev,
        secondaryRegions: exists
          ? current.filter((r) => r !== region)
          : [...current, region],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState) return;

    // Simple required validation
    if (!formState.name || !formState.email || !formState.phone) {
      alert("Name, email, and phone are required.");
      return;
    }

    if (!formState.primaryRegion) {
      alert("Please select a primary region.");
      return;
    }

    const now = Date.now();

    if (mode === "create") {
      const newDriver: Driver = {
        ...(formState as Driver),
        id: `drv-${now}`,
        code: formState.code || `DRV-${drivers.length + 1}`.padStart(7, "0"),
      };
      setDrivers((prev) => [...prev, newDriver]);
    } else if (mode === "edit" && formState.id) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === formState.id ? (formState as Driver) : d))
      );
    }

    closeForm();
  };

  const toggleActive = (id: string) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Drivers
            </h1>
            <p className="text-sm text-slate-600">
              Manage driver profiles, service regions, and capacity. These
              records will be used by the assignment engine and Driver PWA.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
          >
            + Add driver
          </button>
        </header>

        {/* Summary cards */}
        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total drivers
            </h2>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {drivers.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active & assignable
            </h2>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {drivers.filter((d) => d.isActive).length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Main regions covered
            </h2>
            <p className="mt-1 text-sm text-slate-800">
              {Array.from(new Set(drivers.map((d) => d.primaryRegion)))
                .map((r) => REGION_LABELS[r])
                .join(", ")}
            </p>
          </div>
        </section>

        {/* Driver table */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Driver
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Regions
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Vehicle
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Capacity
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-slate-900">{d.name}</div>
                    <div className="text-xs text-slate-600">{d.email}</div>
                    <div className="text-xs text-slate-500">{d.phone}</div>
                    {d.code && (
                      <div className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {d.code}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-700">
                    <div className="font-medium">
                      {REGION_LABELS[d.primaryRegion]}
                    </div>
                    {d.secondaryRegions && d.secondaryRegions.length > 0 && (
                      <div className="mt-0.5 text-slate-500">
                        Also:{" "}
                        {d.secondaryRegions
                          .map((r) => REGION_LABELS[r])
                          .join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-700">
                    {VEHICLE_LABELS[d.vehicleType]}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-slate-700">
                    <div>
                      Max/day:{" "}
                      <span className="font-medium">
                        {d.maxJobsPerDay}
                      </span>
                    </div>
                    <div>
                      Max/slot:{" "}
                      <span className="font-medium">
                        {d.maxJobsPerSlot}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Hours: {d.workDayStartHour}:00 – {d.workDayEndHour}:00
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={[
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                        d.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200",
                      ].join(" ")}
                    >
                      {d.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top text-right text-xs">
                    <button
                      type="button"
                      onClick={() => openEdit(d)}
                      className="mr-2 text-sky-600 hover:text-sky-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(d.id)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      {d.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}

              {drivers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-xs text-slate-500"
                  >
                    No drivers yet. Click &quot;Add driver&quot; to create
                    your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {/* Sliding panel form */}
      {mode && formState && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  {mode === "create" ? "Add driver" : "Edit driver"}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Driver settings here will directly affect auto-assignment and
                  capacity calculation.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm"
            >
              {/* Identity */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g. Alex Tan"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    value={formState.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="+65 ..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Internal driver code
                </label>
                <input
                  name="code"
                  value={formState.code ?? ""}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="e.g. DRV-001"
                />
                <p className="text-[10px] text-slate-500">
                  Optional – used for internal reference on the ops side.
                </p>
              </div>

              {/* Regions & vehicle */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Primary region <span className="text-red-500">*</span>
                </label>
                <select
                  name="primaryRegion"
                  value={formState.primaryRegion}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {REGION_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {REGION_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Secondary regions
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REGION_OPTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleSecondaryRegion(r)}
                      className={[
                        "rounded-full border px-2 py-0.5 text-[11px]",
                        formState.secondaryRegions?.includes(r)
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-slate-50 text-slate-600",
                      ].join(" ")}
                    >
                      {REGION_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Vehicle type
                </label>
                <select
                  name="vehicleType"
                  value={formState.vehicleType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {VEHICLE_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {VEHICLE_LABELS[v]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capacity */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Max jobs per day
                  </label>
                  <input
                    name="maxJobsPerDay"
                    type="number"
                    min={1}
                    value={formState.maxJobsPerDay}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Max jobs per time slot
                  </label>
                  <input
                    name="maxJobsPerSlot"
                    type="number"
                    min={1}
                    value={formState.maxJobsPerSlot}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Workday start (hour)
                  </label>
                  <input
                    name="workDayStartHour"
                    type="number"
                    min={0}
                    max={23}
                    value={formState.workDayStartHour}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Workday end (hour)
                  </label>
                  <input
                    name="workDayEndHour"
                    type="number"
                    min={0}
                    max={23}
                    value={formState.workDayEndHour}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Status & notes */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600"
                />
                <label
                  htmlFor="isActive"
                  className="text-xs text-slate-700"
                >
                  Active & eligible for auto-assignment
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Notes (internal)
                </label>
                <textarea
                  name="notes"
                  value={formState.notes ?? ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Special instructions, skills, or limitations..."
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-700"
                >
                  {mode === "create" ? "Create driver" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
