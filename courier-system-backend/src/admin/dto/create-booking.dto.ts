// src/admin/dto/create-booking.dto.ts
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';
import { JobType, RegionCode } from '../../../generated/prisma/client';

export class CreateBookingStopDto {
  @IsString()
  type: 'pickup' | 'delivery' | 'return';

  @IsString()
  label: string;

  @IsString()
  addressLine: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsString()
  region: RegionCode;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class CreateBookingDto {
  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsString()
  pickupRegion: RegionCode;

  // yyyy-mm-dd from the booking wizard
  @IsString()
  pickupDate: string;

  @IsString()
  pickupSlot: string;

  @IsString()
  jobType: JobType; // "scheduled" | "same_day" etc.

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  routeType?: string;

  @IsOptional()
  @IsNumber()
  totalBillableWeightKg?: number;

  @IsOptional()
  @IsArray()
  stops?: CreateBookingStopDto[];
}
