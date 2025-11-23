import type { ReactNode } from "react";

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <main className="mx-auto max-w-md min-h-screen flex flex-col">
          <header className="px-4 py-3 border-b border-slate-800">
            <h1 className="text-lg font-semibold">Driver App</h1>
            <p className="text-xs text-slate-400">
              Optimised for mobile · Install as PWA later.
            </p>
          </header>
          <section className="flex-1">{children}</section>
          <footer className="px-4 py-2 border-t border-slate-800 text-xs text-slate-500">
            Courier Driver • Prototype UI
          </footer>
        </main>
      </body>
    </html>
  );
}
