// src/lib/api/driver-proof.ts
import { API_BASE_URL, USE_BACKEND } from "@/lib/config";

export type ProofPhotoDto = {
  id: string;
  jobId: string;
  stopId?: string | null;
  url: string;
  takenAt: string;
};

export async function uploadProofPhoto(
  jobId: string,
  file: File,
  stopId?: string
): Promise<ProofPhotoDto> {
  if (!USE_BACKEND) {
    console.warn("[uploadProofPhoto] Backend disabled (USE_BACKEND=false)");
    throw new Error("Backend is disabled; cannot upload proof photo.");
  }

  const formData = new FormData();
  formData.append("file", file);
  if (stopId) {
    formData.append("stopId", stopId);
  }

  const res = await fetch(`${API_BASE_URL}/driver/jobs/${jobId}/proof`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to upload proof photo: ${res.status} ${res.statusText} ${text}`
    );
  }

  const data = (await res.json()) as ProofPhotoDto;
  return data;
}
