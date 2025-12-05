import type { Driver } from '../../../generated/prisma/client';

export function toDriverResponse(d: Driver) {
  return {
    id: d.id,
    // Prisma model doesn’t have `code` yet – return null
    code: (d as any).code ?? null,
    name: d.name,
    email: d.email ?? null,
    phone: d.phone ?? null,
    vehicleType: d.vehicleType,
    vehiclePlate: d.vehiclePlate ?? null,
    primaryRegion: d.primaryRegion,
    secondaryRegions: d.secondaryRegions ?? [],
    isActive: d.isActive,
    maxJobsPerDay: d.maxJobsPerDay,
    maxJobsPerSlot: d.maxJobsPerSlot,
    workDayStartHour: d.workDayStartHour,
    workDayEndHour: d.workDayEndHour,
    currentStatus: d.currentStatus,
    lastSeenAt: d.lastSeenAt,
    location:
      d.locationLat != null && d.locationLng != null
        ? { lat: d.locationLat, lng: d.locationLng }
        : null,
    notes: d.notes ?? null,
  };
}
