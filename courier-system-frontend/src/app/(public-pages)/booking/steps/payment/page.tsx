//src/app/(public-pages)/booking/steps/payment/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { markJobPaymentSuccess } from "@/lib/api/admin";
import { StepLayout } from "@/components/wizard/StepLayout";
import { useBooking } from "@/lib/booking-store";
import { mockEstimatePrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";

type PaymentPageProps = {
  searchParams?: {
    jobId?: string;
  };
};

export default function PaymentPage({ searchParams }: PaymentPageProps) {
  const router = useRouter();
  const jobId = searchParams?.jobId;
  const [submitting, setSubmitting] = useState(false);
  const { serviceType, deliveries, items } = useBooking();

  const [error, setError] = useState<string | null>(null);

  // 10-minute payment window (600 seconds)
  const [secondsLeft, setSecondsLeft] = useState(600);

  // Guard: if no jobId, send back to summary
  useEffect(() => {
    if (!jobId) {
      router.replace("/booking/steps/summary");
    }
  }, [jobId, router]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;

    const id = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [secondsLeft]);

  const isExpired = secondsLeft <= 0;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // ─────────────────────────────────────────────
  // Reuse pricing logic to show PayNow amount
  // ─────────────────────────────────────────────

  const totalBillableWeight = useMemo(() => {
    if (!items) return 0;
    return items.reduce((sum, item) => {
      const vol = item.volumetricWeightKg || 0;
      const actual = item.weightKg || 0;
      const billablePerUnit = vol > actual ? vol : actual;
      const qty = item.quantity || 1;
      return sum + billablePerUnit * qty;
    }, 0);
  }, [items]);

  const mockDistanceKm = 12;

  const estimatedPrice = useMemo(() => {
    if (!serviceType) return 0;
    return mockEstimatePrice({
      distanceKm: mockDistanceKm,
      totalBillableWeightKg: totalBillableWeight,
      stops: deliveries?.length ?? 0,
      serviceType,
    });
  }, [serviceType, totalBillableWeight, deliveries?.length]);

  // ─────────────────────────────────────────────
  // Button handlers
  // ─────────────────────────────────────────────

  const handlePaymentSuccess = async () => {
    if (!jobId) return;

    if (isExpired) {
      setError(
        "Payment session has expired. Please go back to the summary and restart the payment."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await markJobPaymentSuccess(jobId);

      // Only after backend marks job as paid & triggers emails:
      router.push(
        `/booking/steps/confirmation?jobId=${encodeURIComponent(jobId)}`
      );
    } catch (err: any) {
      console.error("[PaymentPage] Failed to mark payment success", err);
      setError(
        err?.message ?? "Failed to confirm payment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentFail = () => {
    if (isExpired) {
      setError(
        "Payment session has expired. Please go back to the summary and restart the payment."
      );
      return;
    }

    setError("Payment failed. Please try again!");
  };

  const handleBack = () => {
    router.push("/booking/steps/summary");
  };

  return (
    <StepLayout
      title="Make Payment"
      subtitle="Scan the PayNow QR to complete your booking."
      currentStep={8}
      totalSteps={9}
      backHref="/booking/steps/summary"
    >
      <div className="space-y-6">
        {/* Timer banner */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
          <div>
            {isExpired ? (
              <>
                Payment session{" "}
                <span className="font-semibold text-red-600">
                  has expired.
                </span>
              </>
            ) : (
              <>
                Payment session will expire in{" "}
                <span className="font-semibold">
                  {minutes.toString().padStart(2, "0")}:
                  {seconds.toString().padStart(2, "0")}
                </span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            In a live system, the payment gateway controls this expiry.
          </div>
        </div>

        {/* Error message (if any) */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Main layout: QR on left, actions on right */}
        <div className="grid gap-4 md:grid-cols-[1.4fr_1.6fr]">
          {/* Left: PayNow QR mock */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              PayNow (Mock)
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Scan this QR with your banking app to simulate a PayNow
              payment.
            </p>

            <div className="mt-4 flex justify-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                PayNow QR Placeholder
              </div>
            </div>

            <div className="mt-4 space-y-1 text-[11px] text-slate-600">
              <p>
                Payee:{" "}
                <span className="font-semibold">
                  STL Courier Pte Ltd
                </span>
              </p>
              <p>
                UEN: <span className="font-mono">2025XXXXXA</span>
              </p>
              <p>
                Amount:{" "}
                <span className="font-semibold">
                  {formatCurrency(estimatedPrice)}
                </span>
              </p>
              <p>
                Reference: <span className="font-mono">{jobId ?? "—"}</span>
              </p>
            </div>
          </div>

          {/* Right: buttons + notes */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payment Actions
            </h2>
            <p className="text-[11px] text-slate-600">
              For this prototype, use the buttons below to simulate the
              payment result. In production, this page would be reached
              after returning from the payment gateway.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handlePaymentSuccess}
                disabled={isExpired || submitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                {submitting ? "Processing…" : "✓ Payment Successful"}
              </button>


              <button
                onClick={handlePaymentFail}
                disabled={isExpired}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                ✗ Payment Failed
              </button>

              <button
                onClick={handleBack}
                className="mt-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                ← Back to Summary
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500">
              In a real integration, the payment provider (e.g. Stripe,
              HitPay, or a PayNow gateway) would redirect back with a
              success / failure status, and you would only show the
              confirmation page after a successful payment.
            </div>
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
