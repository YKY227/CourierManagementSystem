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
  const numericWeight =
    typeof total === "number" ? total : Number(total ?? 0);

  return {
    ...raw,
    totalBillableWeightKg: numericWeight,
    // our frontend expects driverId
    driverId:
      raw.currentDriverId ?? raw.driverId ?? null,
  } as JobSummary;
}

/**
 * GET /admin/jobs
 */
export async function fetchAdminJobs(): Promise<JobSummary[]> {
  if (!USE_BACKEND) {
    throw new Error("fetchAdminJobs called while USE_BACKEND=false");
  }

  const res = await fetch(`${API_BASE_URL}/admin/jobs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch admin jobs: ${res.status} ${res.statusText} ${text}`,
    );
  }

  const data = (await res.json()) as RawJobFromBackend[];
  return data.map(normaliseJob);
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
  payload: AssignJobPayload,
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
      `Failed to assign job ${jobId}: ${res.status} ${res.statusText} ${text}`,
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
  jobId: string,
): Promise<JobSummary> {
  if (!USE_BACKEND) {
    console.warn("autoAssignJobOnBackend called while USE_BACKEND=false");
    throw new Error("Backend is disabled (USE_BACKEND=false)");
  }

  const res = await fetch(
    `${API_BASE_URL}/admin/jobs/${jobId}/auto-assign`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to auto-assign job ${jobId}: ${res.status} ${res.statusText} ${text}`,
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