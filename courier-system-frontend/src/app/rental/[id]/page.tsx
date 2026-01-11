//src/app/rental/[id]/page.tsx

// src/app/rental/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Package,
  Shield,
  Truck,
} from "lucide-react";

import type { Equipment } from "@/lib/rental/types";
import { localEquipmentRepo } from "@/lib/rental/equipment-repo";

type FulfillmentMode = "deliver" | "self_collect";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(n);
}

function daysInclusive(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  const ms = e.getTime() - s.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  return days;
}

/**
 * Simple tier logic for MVP:
 * - days >= 28 => monthRate prorated by 30-day "months"
 * - else days >= 7 => weekRate prorated by 7-day "weeks"
 * - else dayRate
 *
 * Later: replace with backend quote endpoint or a shared pricing lib.
 */
function calcRentalSubtotal(e: Equipment, days: number, qty: number) {
  const day = e.pricing.dayRate ?? 0;
  const week = e.pricing.weekRate ?? null;
  const month = e.pricing.monthRate ?? null;

  if (days <= 0 || qty <= 0) return 0;

  let perUnit = day * days;

  if (month && days >= 28) {
    const months = days / 30;
    perUnit = month * months;
  } else if (week && days >= 7) {
    const weeks = days / 7;
    perUnit = week * weeks;
  }

  return Math.round(perUnit * qty);
}

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();

  const equipmentId = (params?.id as string) ?? "";

  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [selectedImg, setSelectedImg] = useState(0);

  // booking inputs (MVP)
  const [qty, setQty] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });

  const [fulfillment, setFulfillment] = useState<FulfillmentMode>("deliver");

  // MVP fixed fees (you can later switch to region-based or distance-based)
  const deliveryFee = fulfillment === "deliver" ? 60 : 0;
  const collectionFee = fulfillment === "deliver" ? 60 : 0;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const e = await localEquipmentRepo.getById(equipmentId);
      if (!mounted) return;

      setEquipment(e);
      setSelectedImg(0);

      // clamp qty to stock if needed
      if (e?.totalUnits && qty > e.totalUnits) setQty(e.totalUnits);

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentId]);

  const days = useMemo(() => daysInclusive(startDate, endDate), [startDate, endDate]);

  const minDays = equipment?.pricing?.minDays ?? 1;
  const deposit = equipment?.pricing?.deposit ?? 0;

  const rentalSubtotal = useMemo(() => {
    if (!equipment) return 0;
    return calcRentalSubtotal(equipment, days, qty);
  }, [equipment, days, qty]);

  const total = useMemo(() => {
    return rentalSubtotal + deliveryFee + collectionFee + deposit;
  }, [rentalSubtotal, deliveryFee, collectionFee, deposit]);

  const inStock = (equipment?.totalUnits ?? 0) > 0;

  const dateValid = days > 0 && days >= minDays;
  const qtyValid =
    qty >= 1 && (!!equipment ? qty <= (equipment.totalUnits ?? 0) : true);

  const canProceed = !!equipment && inStock && dateValid && qtyValid;

  function handleProceed() {
    if (!equipment) return;

    const qp = new URLSearchParams();
    qp.set("equipmentId", equipment.id);
    qp.set("qty", String(qty));
    qp.set("start", startDate);
    qp.set("end", endDate);
    qp.set("fulfillment", fulfillment);

    router.push(`/rental/checkout?${qp.toString()}`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading equipment…
        </div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Not found</h1>
            <p className="mt-1 text-sm text-slate-600">
              This equipment does not exist (or is not available).
            </p>
          </div>
          <Link
            href="/rental"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  const heroImg = equipment.images?.[selectedImg] ?? equipment.images?.[0] ?? "";

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Equipment Rental
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {equipment.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {equipment.brand ?? "—"}
            {equipment.model ? ` • ${equipment.model}` : ""}
          </p>
        </div>

        <Link
          href="/rental"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Back
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left: gallery + details */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[16/10] w-full bg-slate-100">
              {heroImg ? (
                <img
                  src={heroImg}
                  alt={equipment.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Package className="h-10 w-10" />
                </div>
              )}
            </div>

            {/* thumbnails */}
            {equipment.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-slate-200 p-3">
                {equipment.images.map((url, idx) => {
                  const active = idx === selectedImg;
                  return (
                    <button
                      key={url + idx}
                      type="button"
                      onClick={() => setSelectedImg(idx)}
                      className={[
                        "h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border",
                        active
                          ? "border-slate-900"
                          : "border-slate-200 hover:border-slate-300",
                      ].join(" ")}
                      aria-label={`Select image ${idx + 1}`}
                    >
                      <img
                        src={url}
                        alt={`${equipment.title} ${idx + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description + specs */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Overview</h2>
              <p className="mt-2 text-sm text-slate-600">{equipment.shortDesc}</p>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {inStock ? `${equipment.totalUnits} unit(s) available` : "Out of stock"}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Min rental: {minDays} day(s)
                </div>
                {deposit > 0 && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-500" />
                    Deposit: {formatMoney(deposit)} (refundable)
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Specifications</h2>

              <div className="mt-3 space-y-2">
                {Object.entries(equipment.specs ?? {}).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="text-xs font-medium text-slate-600">{k}</div>
                    <div className="text-xs text-slate-900">{v}</div>
                  </div>
                ))}
                {(!equipment.specs || Object.keys(equipment.specs).length === 0) && (
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    No specs provided yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: booking panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Create rental booking (MVP)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Later we’ll connect this to backend availability + pricing.
            </p>

            {/* Pricing card */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-baseline justify-between">
                <div className="text-xs text-slate-500">From</div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatMoney(equipment.pricing.dayRate)}
                  <span className="text-xs font-medium text-slate-500">/day</span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white p-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Day
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {formatMoney(equipment.pricing.dayRate)}
                  </div>
                </div>
                <div className="rounded-lg bg-white p-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Week
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {equipment.pricing.weekRate ? formatMoney(equipment.pricing.weekRate) : "—"}
                  </div>
                </div>
                <div className="rounded-lg bg-white p-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Month
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {equipment.pricing.monthRate ? formatMoney(equipment.pricing.monthRate) : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, equipment.totalUnits)}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                {!qtyValid && (
                  <p className="mt-1 text-xs text-rose-600">
                    Quantity exceeds available units ({equipment.totalUnits}).
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    End date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {!dateValid && (
                <p className="text-xs text-rose-600">
                  Please select a valid date range (min {minDays} day(s)).
                </p>
              )}

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Fulfillment
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillment("deliver")}
                    className={[
                      "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                      fulfillment === "deliver"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Truck className="h-4 w-4" />
                    Deliver
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillment("self_collect")}
                    className={[
                      "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                      fulfillment === "self_collect"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <Package className="h-4 w-4" />
                    Self-collect
                  </button>
                </div>
              </div>
            </div>

            {/* Quote */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price estimate
                </div>
                <div className="text-xs text-slate-500">
                  {days > 0 ? `${days} day(s)` : "—"}
                </div>
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Rental subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(rentalSubtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Delivery fee</span>
                  <span className="text-slate-900">{formatMoney(deliveryFee)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Collection fee</span>
                  <span className="text-slate-900">{formatMoney(collectionFee)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Deposit (refundable)</span>
                  <span className="text-slate-900">{formatMoney(deposit)}</span>
                </div>

                <div className="mt-2 border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">Total</span>
                    <span className="text-slate-900 font-semibold">
                      {formatMoney(total)}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  This is an MVP estimate. Final pricing may vary based on location, scheduling, and availability.
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleProceed}
              disabled={!canProceed}
              className={[
                "mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold",
                canProceed
                  ? "bg-sky-600 text-white hover:bg-sky-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-500",
              ].join(" ")}
            >
              Proceed to checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>

            {!inStock && (
              <p className="mt-2 text-xs text-rose-600">
                This item is currently out of stock.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
