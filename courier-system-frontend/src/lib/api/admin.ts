// src/lib/api/admin.ts
import { API_BASE_URL, USE_BACKEND } from "../config";
import type { JobSummary } from "../types";

type RawJobFromBackend = any;

/**
 * Normalise a raw Job row from Nest/Prisma into our JobSummary shape.
 * Also ensures totalBillableWeightKg is a number and maps currentDriverId → driverId.
 */
function normaliseJob(raw: RawJobFromBackend): JobSummary {
  const total = raw.totalBillableWeightKg;
  const numericWeight = typeof total === "number" ? total : Number(total ?? 0);

  return {
    ...raw,
    totalBillableWeightKg: numericWeight,
    // our frontend expects driverId
    driverId: raw.currentDriverId ?? raw.driverId ?? null,
  } as JobSummary;
}

/**
 * GET /admin/jobs
 */
export async function fetchAdminJobs(status?: string): Promise<JobSummary[]> {
  if (!USE_BACKEND) {
    throw new Error("fetchAdminJobs called while USE_BACKEND=false");
  }

  // Build URL, optionally appending ?status=...
  let url = `${API_BASE_URL}/admin/jobs`;
  if (status) {
    url += `?status=${encodeURIComponent(status)}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch admin jobs: ${res.status} ${res.statusText} ${text}`
    );
  }

  const data = (await res.json()) as RawJobFromBackend[];
  return data.map(normaliseJob);
}

export interface CreateBookingPayload {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  pickupRegion: string;
  pickupDate: string; // yyyy-mm-dd
  pickupSlot: string;
  jobType: "scheduled" | "same_day";
  serviceType?: string;
  routeType?: string;
  totalBillableWeightKg?: number;
  stops?: Array<{
    type: "pickup" | "delivery" | "return";
    label: string;
    addressLine: string;
    postalCode?: string;
    region: string;
    contactName?: string;
    contactPhone?: string;
  }>;
}

export async function createJobFromBooking(
  payload: CreateBookingPayload
): Promise<RawJobFromBackend> {
  if (!USE_BACKEND) {
    throw new Error("createJobFromBooking called while USE_BACKEND=false");
  }

  const res = await fetch(`${API_BASE_URL}/admin/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to create job: ${res.status} ${res.statusText} ${text}`
    );
  }

  const data = (await res.json()) as RawJobFromBackend;
  return data;
}

export async function markJobPaymentSuccess(jobPublicId: string): Promise<{
  ok: boolean;
  jobId: string;
  paymentStatus: string;
}> {
  if (!USE_BACKEND) {
    throw new Error("markJobPaymentSuccess called while USE_BACKEND=false");
  }

  const url = `${API_BASE_URL}/tracking/${encodeURIComponent(
    jobPublicId
  )}/payment-success`;

  console.log("[markJobPaymentSuccess] calling URL:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      "[markJobPaymentSuccess] backend error",
      res.status,
      text
    );
    throw new Error(
      `Failed to mark payment success: ${res.status} ${res.statusText} ${text}`
    );
  }

  return (await res.json()) as {
    ok: boolean;
    jobId: string;
    paymentStatus: string;
  };
}




export async function fetchAdminCompletedJobs(): Promise<JobSummary[]> {
  // simply delegate to fetchAdminJobs with the "completed" status
  return fetchAdminJobs("completed");
}

// ─────────────────────────────────────────────
// Single-job manual assign
// ─────────────────────────────────────────────
export type AssignJobPayload = {
  driverId: string;
  mode: "auto" | "manual";
};

/**
 * PATCH /admin/jobs/:id/assign
 */
export async function assignJobOnBackend(
  jobId: string,
  payload: AssignJobPayload
): Promise<JobSummary> {
  if (!USE_BACKEND) {
    console.warn("assignJobOnBackend called while USE_BACKEND=false");
    throw new Error("Backend is disabled (USE_BACKEND=false)");
  }

  const res = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/assign`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to assign job ${jobId}: ${res.status} ${res.statusText} ${text}`
    );
  }

  const raw = (await res.json()) as RawJobFromBackend;
  return normaliseJob(raw);
}

// ─────────────────────────────────────────────
// Auto-assign a single pending job on backend
// ─────────────────────────────────────────────

/**
 * POST /admin/jobs/:id/auto-assign
 * Lets NestJS pick the best driver + update DB.
 */
export async function autoAssignJobOnBackend(
  jobId: string
): Promise<JobSummary> {
  if (!USE_BACKEND) {
    console.warn("autoAssignJobOnBackend called while USE_BACKEND=false");
    throw new Error("Backend is disabled (USE_BACKEND=false)");
  }

  const res = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/auto-assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to auto-assign job ${jobId}: ${res.status} ${res.statusText} ${text}`
    );
  }

  const raw = (await res.json()) as RawJobFromBackend;
  return normaliseJob(raw);
}

// Reuse your DTO shape on the frontend:
export type ProofPhotoDto = {
  id: string;
  jobId: string;
  stopId?: string | null;
  url: string;
  takenAt: string;
};

// For stops shown in the admin modal
export type AdminJobStopDto = {
  id: string;
  sequenceIndex: number;
  type: "pickup" | "delivery" | "return";
  label: string;
  addressLine: string;
  postalCode: string | null;
  region: string;
  contactName: string | null;
  contactPhone: string | null;
  status: string;
  completedAt: string | null;
};

export type AdminJobDetailDto = {
  job: JobSummary & {
    driverName?: string | null;
    driverPhone?: string | null;
  };
  stops: AdminJobStopDto[];
  proofPhotos: ProofPhotoDto[];
};

// GET /admin/jobs/:id/detail
export async function fetchAdminCompletedJobDetail(
  jobId: string
): Promise<AdminJobDetailDto> {
  const res = await fetch(`${API_BASE_URL}/admin/jobs/${jobId}/detail`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch job detail ${jobId}: ${res.status} ${res.statusText} ${text}`
    );
  }

  const data = (await res.json()) as AdminJobDetailDto;
  return data;
}

/**
 * Public tracking fetch (by publicId, e.g. "STL-241123-0999").
 * Uses the same DTO as admin job detail.
 */
export async function fetchPublicTrackingJob(
  publicId: string
): Promise<AdminJobDetailDto> {
  if (!USE_BACKEND) {
    throw new Error("fetchPublicTrackingJob called while USE_BACKEND=false");
  }

  const res = await fetch(
    `${API_BASE_URL}/tracking/${encodeURIComponent(publicId)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch tracking job: ${res.status} ${res.statusText} ${text}`
    );
  }

  const data = (await res.json()) as AdminJobDetailDto;
  return data;
}
