export class UpdateDriverDto {
  name?: string;
  email?: string;
  phone?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  primaryRegion?: string;
  secondaryRegions?: string[];
  maxJobsPerDay?: number;
  maxJobsPerSlot?: number;
  workDayStartHour?: number;
  workDayEndHour?: number;
  isActive?: boolean;
  currentStatus?: string;

  location?: {
    lat: number;
    lng: number;
  };

  notes?: string | null;
}
