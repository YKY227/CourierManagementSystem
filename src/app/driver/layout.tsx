"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/driver/jobs", label: "Jobs" },
  { href: "/driver/history", label: "History" },
  { href: "/driver/settings", label: "Settings" },
];

export default function DriverLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto flex min-h-screen max-w-md flex-col">
        {/* Header */}
        <header className="border-b border-slate-800 px-4 py-3">
          <h1 className="text-sm font-semibold">Driver App</h1>
          <p className="text-[11px] text-slate-400">
            Optimised for mobile · Works offline · PWA-ready later.
          </p>
        </header>

        {/* Content */}
        <section className="flex-1 overflow-y-auto">{children}</section>

        {/* Bottom nav */}
        <nav className="sticky bottom-0 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-around gap-2 text-[11px]">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/driver/history" &&
                  pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex flex-1 flex-col items-center rounded-xl px-2 py-1.5 transition",
                    active
                      ? "bg-slate-800 text-sky-300"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                  ].join(" ")}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.href === "/driver/jobs" && (
                    <span className="text-[10px] text-slate-400">
                      Today&apos;s runs
                    </span>
                  )}
                  {item.href === "/driver/history" && (
                    <span className="text-[10px] text-slate-400">
                      Past jobs
                    </span>
                  )}
                  {item.href === "/driver/settings" && (
                    <span className="text-[10px] text-slate-400">
                      Profile & app
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
