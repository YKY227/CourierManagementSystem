// app/admin/layout.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getCurrentAdmin,
  logoutAdmin,
  type AdminSession,
} from "@/lib/admin-auth";

type AdminLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Jobs", href: "/admin/jobs" },
  { label: "Drivers", href: "/admin/drivers" },
  { label: "Assignment Policy", href: "/admin/assignment-policy" },
  { label: "Pricing Config", href: "/admin/pricing" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // ✅ avoid "possibly null" everywhere
  const safePathname = pathname ?? "";

  const [session, setSession] = useState<AdminSession | null>(null);
  const [initialised, setInitialised] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isLoginPage = safePathname === "/admin/login";

  // Read session on route change
  useEffect(() => {
    const s = getCurrentAdmin();
    setSession(s);
    setInitialised(true);
  }, [safePathname]);

  const isAuthenticated = !!session;

  // Redirect logic
  useEffect(() => {
    if (!initialised) return;

    if (!isAuthenticated && !isLoginPage) {
      router.replace("/admin/login");
      return;
    }

    if (isAuthenticated && isLoginPage) {
      router.replace("/admin/dashboard");
      return;
    }
  }, [initialised, isAuthenticated, isLoginPage, router]);

  // Derived nav info (✅ longest href wins)
  const currentNavItem = useMemo(() => {
    const sorted = [...navItems].sort((a, b) => b.href.length - a.href.length);
    return sorted.find((item) => safePathname.startsWith(item.href));
  }, [safePathname]);

  const breadcrumbText = useMemo(() => {
    const parts = ["Admin"];
    if (currentNavItem?.label) parts.push(currentNavItem.label);
    return parts.join(" / ");
  }, [currentNavItem]);

  const handleLogout = () => {
    logoutAdmin();
    setSession(null);
    router.replace("/admin/login");
  };

  // ─────────────────────────────────────────────
  // Render branches
  // ─────────────────────────────────────────────

  if (!initialised) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-xs text-slate-500">
        Loading admin console…
      </div>
    );
  }

  // Login page: no sidebar, light theme
  if (isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        {children}
      </div>
    );
  }

  // Authenticated admin shell
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {/* Sidebar - desktop */}
      <aside
        className={[
          "hidden border-r border-slate-200 bg-white transition-all duration-200 md:flex md:flex-col",
          sidebarCollapsed ? "w-16" : "w-52",
        ].join(" ")}
      >
        <div className="border-b border-slate-200 px-3 py-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            Courier Ops
          </div>
          {!sidebarCollapsed && (
            <div className="text-sm font-semibold text-slate-800">
              Admin Console
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
          const active =
  safePathname === item.href ||
  (item.href !== "/driver/history" && safePathname.startsWith(item.href));


            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center rounded-lg px-2 py-2 text-sm transition-colors",
                  active
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                {/* Tiny "icon" using first letter */}
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700">
                  {item.label.charAt(0)}
                </span>
                {!sidebarCollapsed && (
                  <span className="ml-2 truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 px-3 py-3 text-xs text-slate-500">
          {!sidebarCollapsed && (
            <div className="truncate">
              Signed in as{" "}
              <span className="font-medium text-slate-800">
                {session?.email ?? "admin"}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 text-xs text-slate-500 hover:text-slate-900"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
          <div className="flex items-center gap-3">
            {/* Collapse toggle - desktop only */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="hidden rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 md:inline-flex"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? "›" : "‹"}
            </button>

            <p className="text-sm font-medium text-slate-700">
              {breadcrumbText}
            </p>
          </div>

          {/* User info + logout (mobile + desktop) */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden max-w-[160px] truncate md:inline-block">
              {session?.email ?? "admin"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-4 md:px-6">{children}</main>
      </div>
    </div>
  );
}
