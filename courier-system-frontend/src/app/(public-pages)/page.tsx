"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* HERO */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
          Fast, Reliable, Same-Day Courier Services
        </h1>
        <p className="mt-4 text-slate-600 text-lg">
          Book pickups, manage multi-stop deliveries, and track your parcels in real-time.
        </p>

        <Link
          href="/booking/steps/delivery-type"
          className="mt-8 inline-flex items-center rounded-xl bg-sky-600 px-6 py-3 text-white text-lg font-semibold hover:bg-sky-700"
        >
          Book a Delivery  
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-slate-900 text-center">Our Services</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Same Day Delivery</h3>
            <p className="text-sm text-slate-600 mt-2">
              Pickup and deliver on the same day between 8am–5:30pm.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Next Day Delivery</h3>
            <p className="text-sm text-slate-600 mt-2">
              Pickup today, deliver next working day morning to evening.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">3-Hour Express</h3>
            <p className="text-sm text-slate-600 mt-2">
              Rapid 3-hour pickup & drop-off with priority slot allocation.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-slate-900 text-center">How It Works</h2>

        <div className="mt-10 grid gap-8 md:grid-cols-4">
          {[
            { step: "1", title: "Book Online", desc: "Select delivery type and route." },
            { step: "2", title: "Set Pickup & Items", desc: "Enter pickup, deliveries & items." },
            { step: "3", title: "Courier Assigned", desc: "We match your job with a driver." },
            { step: "4", title: "Track Delivery", desc: "Live updates from pickup to drop-off." },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
                {s.step}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FOOTER */}
      <footer className="bg-sky-600 py-12 text-center">
        <h3 className="text-xl font-semibold text-white">Ready to send something?</h3>
        <Link
          href="/booking"
          className="mt-4 inline-flex items-center rounded-xl bg-white px-6 py-3 text-sky-700 font-semibold hover:bg-slate-100"
        >
          Book a Delivery Now
        </Link>
      </footer>
    </div>
  );
}
