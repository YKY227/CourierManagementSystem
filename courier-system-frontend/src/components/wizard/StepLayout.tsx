// src/components/wizard/StepLayout.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";

interface StepLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  backHref?: string;
}

export function StepLayout({
  title,
  subtitle,
  children,
  currentStep,
  totalSteps,
  backHref,
}: StepLayoutProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Booking Wizard
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              Step {currentStep} of {totalSteps}
            </p>
            <div className="mt-1 h-1 w-32 rounded-full bg-slate-200">
              <div
                className="h-1 rounded-full bg-sky-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {backHref && (
          <div className="mb-4">
            <Link
              href={backHref}
              className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700"
            >
              ← Back
            </Link>
          </div>
        )}

        <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4 sm:p-6">
          {children}
        </section>
      </div>
    </main>
  );
}
