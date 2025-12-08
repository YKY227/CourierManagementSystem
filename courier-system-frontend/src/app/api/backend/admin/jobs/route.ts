// src/app/api/backend/admin/jobs/route.ts
import type { NextRequest } from "next/server";

const NEST_BASE =
  process.env.NEXT_PUBLIC_NEST_URL ?? "http://localhost:3000";

export async function GET(_req: NextRequest) {
  try {
    const upstream = await fetch(`${NEST_BASE}/admin/jobs`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      console.error("[proxy] /admin/jobs upstream failed", upstream.status, text);
      return new Response(
        JSON.stringify({
          error: "Upstream error",
          status: upstream.status,
        }),
        {
          status: upstream.status,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Pass JSON through as-is
    return new Response(text, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("[proxy] /admin/jobs threw", err);
    return new Response(
      JSON.stringify({
        error: "Proxy crashed",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
}
