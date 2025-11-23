"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

const STATUS_STEPS = [
  { id: "booked", label: "Booked", description: "Job has been created in the system." },
  { id: "allocated", label: "Allocated", description: "A driver has been assigned." },
  { id: "pickup", label: "Out for pickup", description: "Driver is heading to the pickup point." },
  { id: "completed", label: "Completed", description: "All deliveries have been completed." },
];

type TrackingPageProps = {
  params: { jobId: string };
};

export default function TrackingPage({ params }: TrackingPageProps) {
  const router = useRouter();
  const { jobId } = params;

  // For now, we mock the "current" status.
  // Later you will replace this with live status from the backend.
  const currentStepIndex = useMemo(() => {
    // Example: derive a pseudo-random status from jobId for fun
    if (!jobId) return 0;
    const digits = jobId.replace(/\D/g, "");
    if (!digits) return 0;
    const lastDigit = Number(digits[digits.length - 1]);
    return lastDigit % STATUS_STEPS.length; // 0–3
  }, [jobId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Track Job
            </h1>
            <p className="text-xs text-slate-500">
              Status updates for your courier booking.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-sky-400 hover:text-sky-700"
          >
            ← Back to Home
          </button>
        </div>

        {/* Job ID card */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Job ID
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900">
            {jobId}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Keep this ID for reference when you contact support or check status.
          </p>
        </div>

        {/* Timeline */}
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Delivery Timeline
          </h2>

          <ol className="relative border-l border-slate-200 pl-4">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <li key={step.id} className="mb-6 last:mb-0">
                  <div className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full border bg-white" 
                       style={{
                         borderColor: isCurrent
                           ? "#0ea5e9" // sky-500
                           : isCompleted
                           ? "#22c55e" // green-500
                           : "#cbd5f5", // slate-300-ish
                         backgroundColor: isCompleted ? "#22c55e" : isCurrent ? "#0ea5e9" : "#ffffff",
                       }}
                  />

                  <div className="ml-2">
                    <p className="text-xs font-semibold text-slate-900">
                      {step.label}{" "}
                      {isCurrent && (
                        <span className="ml-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                          Current
                        </span>
                      )}
                      {isCompleted && !isCurrent && (
                        <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          Done
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {step.description}
                    </p>
                    {/* Later you can show timestamps here, e.g. "Updated at 14:32" */}
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-4 text-[11px] text-slate-500">
            This is a prototype view. In the real system, each step would be powered
            by live updates from the driver app and operations dashboard.
          </p>
        </section>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/booking/steps/delivery-type")}
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            + Book another job
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:border-sky-400 hover:text-sky-700"
          >
            Back to homepage
          </button>
        </div>
      </main>
    </div>
  );
}
