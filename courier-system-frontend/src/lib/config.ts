// src/lib/config.ts

export const USE_BACKEND: boolean =
  process.env.NEXT_PUBLIC_USE_BACKEND === "true";

// Browser-facing base URL (Next.js API routes)
export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

// Backend (Nest) base URL – used ONLY on the server / API proxy routes
export const BACKEND_BASE: string =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:3000";
