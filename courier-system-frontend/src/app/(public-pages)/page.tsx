// src/app/(public-pages)/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Truck, Wrench, PackageSearch, CalendarDays } from "lucide-react";
import LoginRoleChooser from "@/components/public/LoginRoleChooser";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* TOP RIGHT LOGIN (admin / driver only) */}
      <div className="mx-auto flex max-w-5xl justify-end px-6 py-4">
        <LoginRoleChooser />
      </div>

      {/* HERO */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
          <Truck className="h-4 w-4" />
          Courier Delivery
          <span className="text-slate-300">•</span>
          <Wrench className="h-4 w-4" />
          Equipment Rental
        </div>

        <h1 className="mt-5 text-4xl font-bold text-slate-900 md:text-5xl">
          Delivery + Equipment Rental, all in one place
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Book multi-stop courier jobs and rent machinery for your project — with clear pricing and real-time tracking.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/booking/steps/delivery-type"
            className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-lg font-semibold text-white hover:bg-sky-700 sm:w-auto"
          >
            Book a Delivery
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>

          <Link
            href="/rental"
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-lg font-semibold text-slate-900 hover:bg-slate-50 sm:w-auto"
          >
            Rent Equipment
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
            Same-day & next-day delivery
          </span>
          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
            3-hour express option
          </span>
          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
            Rental delivery / self-collect
          </span>
          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
            Admin + driver operations
          </span>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-2xl font-semibold text-slate-900">
          Choose a service
        </h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Courier card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  <Truck className="h-4 w-4" />
                  Courier Delivery
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  Fast, reliable deliveries (multi-stop supported)
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Book pickups, manage multi-stop routes, and track your parcels from pickup to proof-of-delivery.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-900">Same Day</h4>
                <p className="mt-1 text-xs text-slate-600">
                  Pickup and deliver on the same day between 8am–5:30pm.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-900">Next Day</h4>
                <p className="mt-1 text-xs text-slate-600">
                  Pickup today, deliver next working day (morning to evening).
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-900">3-Hour Express</h4>
                <p className="mt-1 text-xs text-slate-600">
                  Priority slot allocation with rapid pickup & drop-off.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Best for: documents, parcels, urgent deliveries, multi-stop routes
              </div>
              <Link
                href="/booking/steps/delivery-type"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Book delivery
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Rental card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <Wrench className="h-4 w-4" />
                  Equipment / Machinery Rental
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  Rent equipment by day, week, or month
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Choose an item, set dates, select delivery or self-collection — pricing is calculated automatically.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <PackageSearch className="h-4 w-4" />
                  Browse catalog
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  View pictures, specs, and rates.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CalendarDays className="h-4 w-4" />
                  Pick dates
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Set rental start & end date.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Truck className="h-4 w-4" />
                  Deliver / collect
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  We deliver, collect — or self-collect.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Best for: construction projects, events, site works, maintenance
              </div>
              <Link
                href="/rental"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Browse rental items
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-2xl font-semibold text-slate-900">
          How it works
        </h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Courier steps */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">Courier Delivery</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { step: "1", title: "Book online", desc: "Select delivery type and route." },
                { step: "2", title: "Set stops & items", desc: "Enter pickup, deliveries & item details." },
                { step: "3", title: "Courier assigned", desc: "We match your job with a driver." },
                { step: "4", title: "Track delivery", desc: "Live updates from pickup to drop-off." },
              ].map((s) => (
                <div key={s.step} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-sm font-bold">
                      {s.step}
                    </div>
                    <div className="font-semibold text-slate-900">{s.title}</div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Link
                href="/booking/steps/delivery-type"
                className="inline-flex items-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Start courier booking
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Rental steps */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">Equipment Rental</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { step: "1", title: "Select equipment", desc: "Choose item type, quantity, and view specs." },
                { step: "2", title: "Choose dates", desc: "Set start/end dates (day/week/month rentals)." },
                { step: "3", title: "Delivery or self-collect", desc: "Pick the most convenient option." },
                { step: "4", title: "Confirm & pay", desc: "Review price breakdown and confirm booking." },
              ].map((s) => (
                <div key={s.step} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
                      {s.step}
                    </div>
                    <div className="font-semibold text-slate-900">{s.title}</div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Link
                href="/rental"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Browse rental items
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <footer className="bg-slate-900 py-10 text-center">
        <h3 className="text-xl font-semibold text-white">Ready to get started?</h3>
        <p className="mt-2 text-sm text-slate-300">
          Book a courier delivery or rent equipment for your project.
        </p>

        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/booking/steps/delivery-type"
            className="inline-flex items-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100"
          >
            Book a Delivery
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>

          <Link
            href="/rental"
            className="inline-flex items-center rounded-xl border border-slate-600 bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Rent Equipment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
