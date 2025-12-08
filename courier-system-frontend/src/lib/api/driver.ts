// src/lib/api/driver.ts
import { API_BASE_URL, USE_BACKEND } from "@/lib/config";
import type { DriverJob, DriverJobStatus } from "@/lib/types";

/**
 * Fetch jobs assigned to a specific driver.
 * Backend: GET /driver/jobs?driverId=DRV_ID
 */
export async function fetchDriverJobs(
  driverId: string,
): Promise<DriverJob[]> {
  if (!USE_BACKEND) {
    console.warn("fetchDriverJobs called while USE_BACKEND=false");
    return [];
  }

  const url = `${API_BASE_URL}/driver/jobs?driverId=${encodeURIComponent(
    driverId,
  )}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // credentials: "include", // uncomment if you add auth cookies later
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to fetch driver jobs: ${res.status} ${res.statusText} ${text}`,
    );
  }

  const data = (await res.json()) as DriverJob[];
  return data;
}

/**
 * Update a job's status from the driver's side.
 * Backend: PATCH /driver/jobs/:jobId/status
 */
export async function updateDriverJobStatusOnBackend(
  jobId: string,
  status: DriverJobStatus,
): Promise<void> {
  if (!USE_BACKEND) {
    console.warn("updateDriverJobStatusOnBackend called while USE_BACKEND=false");
    return;
  }

  const res = await fetch(`${API_BASE_URL}/driver/jobs/${jobId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to update driver job status for ${jobId}: ${res.status} ${res.statusText} ${text}`,
    );
  }

  // If your backend returns the updated job, you can parse it here:
  // const updated = await res.json();
  // return updated as DriverJob;
}

/**
 * Mark a specific stop as completed.
 * Backend: PATCH /driver/jobs/:jobId/stops/:stopId
 */
export async function markDriverJobStopOnBackend(
  jobId: string,
  stopId: string,
): Promise<void> {
  if (!USE_BACKEND) {
    console.warn("markDriverJobStopOnBackend called while USE_BACKEND=false");
    return;
  }

  const res = await fetch(
    `${API_BASE_URL}/driver/jobs/${jobId}/stops/${stopId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // body can carry extra metadata later
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to mark stop ${stopId} for job ${jobId}: ${res.status} ${res.statusText} ${text}`,
    );
  }

  // Same as above, you can parse updated job if backend returns it.
}


export type ProofPhotoDto = {
  id: string;
  url: string;
  takenAt: string;
  stopId?: string | null;
  jobId?: string;
  driverId?: string | null;
};

/**
 * Upload a proof photo for a given job (and optional stop).
 * Backend route (from F1): POST /driver/jobs/:jobId/proof
 */
export async function uploadProofPhotoOnBackend(opts: {
  jobId: string;
  stopId?: string | null;
  file: File;
  driverId?: string | null;
}): Promise<ProofPhotoDto> {
  const { jobId, stopId, file, driverId } = opts;

  if (!USE_BACKEND) {
    console.warn(
      "uploadProofPhotoOnBackend called while USE_BACKEND=false – this should only be used when backend is enabled."
    );
    throw new Error("Backend disabled");
  }

  const form = new FormData();
  form.append("file", file);
  if (stopId) form.append("stopId", stopId);
  if (driverId) form.append("driverId", driverId);

  const res = await fetch(`${API_BASE_URL}/driver/jobs/${jobId}/proof`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to upload proof photo for job ${jobId}: ${res.status} ${res.statusText} ${text}`
    );
  }

  const json = (await res.json()) as ProofPhotoDto;
  return json;
}