// src/lib/api/drivers.ts
import { API_BASE_URL, USE_BACKEND } from "../config";
import type { Driver } from "../types";

/**
 * Fetch all drivers from NestJS backend (GET /admin/drivers)
 */
export async function fetchAdminDrivers(): Promise<Driver[]> {
  if (!USE_BACKEND) {
    console.warn("fetchAdminDrivers() called while USE_BACKEND=false");
    return [];
  }

  const res = await fetch(`${API_BASE_URL}/admin/drivers`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch admin drivers: ${res.status} ${res.statusText} ${text}`
    );
  }

  const data = await res.json();

  // Ensure backend returns an array
  if (!Array.isArray(data)) {
    console.error("fetchAdminDrivers: Expected array, got:", data);
    return [];
  }

  return data as Driver[];
}
