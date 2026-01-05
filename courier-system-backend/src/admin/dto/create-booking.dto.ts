// src/admin/dto/create-booking.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";
import {
  JobType,
  RegionCode,
  AssignmentMode,
} from "../../../generated/prisma/client";

export class CreateBookingStopDto {
  @IsString()
  @IsIn(["pickup", "delivery", "return"])
  type: "pickup" | "delivery" | "return";

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

  // ✅ New (optional): geo for pricing/distance
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  // ✅ New (optional): stop notes
  @IsOptional()
  @IsString()
  notes?: string;
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
  jobType: JobType; // e.g. "scheduled"

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  routeType?: string;

  @IsOptional()
  @IsNumber()
  totalBillableWeightKg?: number;

  // ✅ New (optional): assignment mode + booking source
  @IsOptional()
  @IsString()
  assignmentMode?: AssignmentMode;

  @IsOptional()
  @IsString()
  source?: string; // "web" | "whatsapp" | "admin" (string for now)

  // ✅ Stops (nested validation)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookingStopDto)
  stops: CreateBookingStopDto[];
}
