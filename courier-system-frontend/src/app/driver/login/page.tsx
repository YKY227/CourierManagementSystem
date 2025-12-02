// src/app/driver/login/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { mockDrivers, REGION_LABELS } from "@/lib/mock/drivers";
import { useDriverIdentity } from "@/lib/use-driver-identity";

// Demo-only PINs for each driver
const DRIVER_PINS: Record<string, string> = {
  "drv-1": "1111",
  "drv-2": "2222",
  "drv-3": "3333",
};

export default function DriverLoginPage() {
  const router = useRouter();
  const { setDriver } = useDriverIdentity();

  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    if (!selectedDriverId) {
      setError("Please select your name.");
      return;
    }

    const driver = mockDrivers.find((d) => d.id === selectedDriverId);
    if (!driver) {
      setError("Driver not found in mock data.");
      return;
    }

    const expectedPin = DRIVER_PINS[selectedDriverId];
    if (expectedPin && pin !== expectedPin) {
      setError("Incorrect PIN (demo only: 1111 / 2222 / 3333).");
      return;
    }

    setSubmitting(true);

    // ✅ Save identity into localStorage + state
    setDriver({
      id: driver.id,
      code: driver.code,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      primaryRegion: driver.primaryRegion,
      vehicleType: driver.vehicleType,
    });

    // ✅ Simple one-shot redirect, no useEffect required here
    router.replace("/driver/jobs");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <h1 className="text-lg font-semibold">Driver Login</h1>
        <p className="mt-1 text-[11px] text-slate-400">
          Select your name to access your assigned jobs. This is a prototype
          login tied to mock driver data.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Driver select */}
          <div className="space-y-1">
            <label
              htmlFor="driver"
              className="text-xs font-medium text-slate-200"
            >
              Driver name
            </label>
            <select
              id="driver"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">-- Select your name --</option>
              {mockDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {REGION_LABELS[d.primaryRegion]}
                </option>
              ))}
            </select>
          </div>

          {/* Demo PIN (optional, but enforced here) */}
          <div className="space-y-1">
            <label
              htmlFor="pin"
              className="text-xs font-medium text-slate-200"
            >
              PIN (demo)
            </label>
            <input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="e.g. 1111 / 2222 / 3333"
            />
            <p className="text-[10px] text-slate-500">
              This is only for prototype. In production, this will be replaced
              by OTP or proper auth.
            </p>
          </div>

          {error && (
            <p className="text-[11px] text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-lg bg-sky-600 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
