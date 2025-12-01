// src/app/driver/login/page.tsx
"use client";

import { useState, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { mockDrivers, REGION_LABELS } from "@/lib/mock/drivers";
import { useDriverIdentity } from "@/lib/use-driver-identity";

// Demo-only PINs – keyed by Driver.id
const DRIVER_PINS: Record<string, string> = {
  "drv-1": "1111",
  "drv-2": "2222",
  "drv-3": "3333",
};

export default function DriverLoginPage() {
  const router = useRouter();
  const { driver, setDriver, loaded } = useDriverIdentity();

  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, you *could* auto-redirect to /driver/jobs.
  // For now we just hint to the user.
  const currentDriverName = useMemo(
    () => driver?.name ?? null,
    [driver]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedDriverId) {
      setError("Please select your name.");
      return;
    }

    const selected = mockDrivers.find((d) => d.id === selectedDriverId);
    if (!selected) {
      setError("Selected driver not found.");
      return;
    }

    const expectedPin = DRIVER_PINS[selected.id];
    if (expectedPin && pin !== expectedPin) {
      setError("Invalid PIN. (Demo: try 1111 / 2222 / 3333)");
      return;
    }

    setSubmitting(true);

    // Store a minimal identity snapshot
    setDriver({
      id: selected.id,
      code: selected.code,
      name: selected.name,
      email: selected.email,
      phone: selected.phone,
      primaryRegion: selected.primaryRegion,
      vehicleType: selected.vehicleType,
    });

    // Redirect to driver jobs list
    router.push("/driver/jobs");
  };

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-xs text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="text-lg font-semibold text-slate-50">
          Driver Login
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Select your name to access your jobs.
        </p>

        {currentDriverName && (
          <p className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-[11px] text-slate-200">
            You are currently logged in as{" "}
            <span className="font-semibold">{currentDriverName}</span>.{" "}
            Logging in again will switch driver on this device.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Driver select */}
          <div className="space-y-1.5">
            <label
              htmlFor="driver-select"
              className="text-xs font-medium text-slate-200"
            >
              Driver name
            </label>
            <select
              id="driver-select"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">-- Select your name --</option>
              {mockDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {REGION_LABELS[d.primaryRegion]}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500">
              This is a demo login for your prototype. In production, this
              will be replaced by phone + OTP or a proper account.
            </p>
          </div>

          {/* PIN (demo only) */}
          <div className="space-y-1.5">
            <label
              htmlFor="driver-pin"
              className="text-xs font-medium text-slate-200"
            >
              PIN (demo)
            </label>
            <input
              id="driver-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="e.g. 1111"
            />
            <p className="text-[10px] text-slate-500">
              Demo only – try <span className="font-mono">1111</span>,{" "}
              <span className="font-mono">2222</span>, or{" "}
              <span className="font-mono">3333</span> based on driver.
            </p>
          </div>

          {error && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
