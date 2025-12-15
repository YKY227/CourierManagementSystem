import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from "class-validator";
import { RegionCode, VehicleType } from "../../../generated/prisma/client";

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  // Optional strict format (recommended for auth UX)
  @Matches(/^DRV-\d{3}$/i, { message: "code must look like DRV-001" })
  code!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsEnum(RegionCode)
  primaryRegion!: RegionCode;

  @IsOptional()
  @IsArray()
  @IsEnum(RegionCode, { each: true })
  secondaryRegions?: RegionCode[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxJobsPerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxJobsPerSlot?: number;

  @IsOptional()
  @IsInt()
  workDayStartHour?: number;

  @IsOptional()
  @IsInt()
  workDayEndHour?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}