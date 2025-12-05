import { Job } from '../../../generated/prisma/client';

export function toJobSummary(j: Job) {
  return {
    id: j.id,
    publicId: j.publicId,
    customerName: j.customerName,
    pickupRegion: j.pickupRegion,
    pickupDate: j.pickupDate ? j.pickupDate.toISOString().slice(0, 10) : null,
    pickupSlot: j.pickupSlot,
    jobType: j.jobType,
    status: j.status,
    assignmentMode: j.assignmentMode,
    driverId: j.currentDriverId ?? null,
    stopsCount: j.stopsCount ?? 0,
    totalBillableWeightKg: j.totalBillableWeightKg
      ? Number(j.totalBillableWeightKg)
      : null,
    createdAt: j.createdAt,
  };
}
