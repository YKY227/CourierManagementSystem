// src/app/api/backend/[...path]/route.ts
import { NextRequest } from "next/server";

//const BACKEND_BASE =
  // process.env.BACKEND_INTERNAL_URL ||
  // process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
  // "http://localhost:3000";
  //process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:3000";
  const BACKEND_BASE = "http://127.0.0.1:3000";

async function proxy(
  req: NextRequest,
  context: { params: { path?: string[] } },
) {
  const { path = [] } = context.params;

  // e.g. ["tracking", "STL-123"] -> "/tracking/STL-123"
  const subPath = "/" + path.join("/");

  const incomingUrl = new URL(req.url);

  // Build target URL by *overwriting* pathname and search,
  // regardless of any path that might exist in BACKEND_BASE
  const targetUrl = new URL(BACKEND_BASE);
  targetUrl.pathname = subPath;
  targetUrl.search = incomingUrl.search; // keep ?status=... etc.

  console.log("[backend proxy] forwarding:", req.method, targetUrl.toString());

  const backendRes = await fetch(targetUrl.toString(), {
    method: req.method,
    headers: {
      "content-type": req.headers.get("content-type") ?? "application/json",
    },
    body: ["GET", "HEAD"].includes(req.method)
      ? undefined
      : await req.text(),
  });

  const text = await backendRes.text().catch(() => "");

  if (!backendRes.ok) {
    console.error(
      "[backend proxy] upstream error",
      backendRes.status,
      text,
    );
  }

  return new Response(text, {
    status: backendRes.status,
    headers: {
      "content-type":
        backendRes.headers.get("content-type") ?? "application/json",
    },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
