// src/lib/config.ts
// export const USE_BACKEND = true;
// export const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

// src/lib/config.ts

// These values are baked at build-time by Next.js.
// Make sure you restart `npm run dev` after changing .env.local.

export const USE_BACKEND: boolean =
  process.env.NEXT_PUBLIC_USE_BACKEND === "true";

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend";

