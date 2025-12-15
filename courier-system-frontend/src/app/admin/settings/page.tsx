// app/admin/settings/page.tsx
"use client";

import { useState } from "react";
import { useAppSettings } from "@/lib/app-settings";

export default function AdminSettingsPage() {
  const [orgName, setOrgName] = useState("Courier Ops (Demo)");
  const [supportEmail, setSupportEmail] = useState("support@courier.com");
  const [whatsappNumber, setWhatsappNumber] = useState("+65 8000 0000");

  const { developerMode, demoMode, setDeveloperMode, setDemoMode } =
  useAppSettings();


  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-50">Settings</h1>
      <p className="text-sm text-slate-400">
        Configure organisation details and integration settings.
      </p>

      <form className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-300">
              Organisation name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300">
              Support email
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300">
            WhatsApp business number (for bot integration)
          </label>
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Later, this will be used to configure the WhatsApp Cloud API and n8n
            workflows.
          </p>
        </div>

        {/* Developer tools */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Developer Tools
          </h2>

          <div className="mt-3 space-y-3">
            {/* Developer Mode */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-100">Developer Mode</p>
                <p className="text-[11px] text-slate-500">
                  Enables extra switches for demo/testing. Turning this off also disables Demo Mode.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeveloperMode(!developerMode)}
                className={[
                  "relative inline-flex h-6 w-11 items-center rounded-full border transition",
                  developerMode
                    ? "border-sky-600 bg-sky-600"
                    : "border-slate-700 bg-slate-800",
                ].join(" ")}
                aria-pressed={developerMode}
                aria-label="Toggle Developer Mode"
              >
                <span
                  className={[
                    "inline-block h-5 w-5 transform rounded-full bg-white transition",
                    developerMode ? "translate-x-5" : "translate-x-1",
                  ].join(" ")}
                />
              </button>
            </div>

            {/* Demo Mode (only when developer mode is on) */}
            {developerMode && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-100">Demo Mode</p>
                  <p className="text-[11px] text-slate-500">
                    Shows mock data (e.g., drivers) with a red <span className="text-rose-400">MOCK</span> badge.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDemoMode(!demoMode)}
                  className={[
                    "relative inline-flex h-6 w-11 items-center rounded-full border transition",
                    demoMode
                      ? "border-rose-600 bg-rose-600"
                      : "border-slate-700 bg-slate-800",
                  ].join(" ")}
                  aria-pressed={demoMode}
                  aria-label="Toggle Demo Mode"
                >
                  <span
                    className={[
                      "inline-block h-5 w-5 transform rounded-full bg-white transition",
                      demoMode ? "translate-x-5" : "translate-x-1",
                    ].join(" ")}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700"
        >
          Save changes (demo only)
        </button>
      </form>
    </div>
  );
}
