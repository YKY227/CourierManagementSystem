// app/admin/settings/page.tsx
"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [orgName, setOrgName] = useState("Courier Ops (Demo)");
  const [supportEmail, setSupportEmail] = useState("support@courier.com");
  const [whatsappNumber, setWhatsappNumber] = useState("+65 8000 0000");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-50">
        Settings
      </h1>
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
            Later, this will be used to configure the WhatsApp Cloud API
            and n8n workflows.
          </p>
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
