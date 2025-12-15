// courier-system-backend/src/admin/dto/update-driver.dto.ts
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { RegionCode, VehicleType } from '../../../generated/prisma/client';

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  vehiclePlate?: string | null;

  @IsOptional()
  @IsEnum(RegionCode)
  primaryRegion?: RegionCode;

  @IsOptional()
  @IsArray()
  @IsEnum(RegionCode, { each: true })
  secondaryRegions?: RegionCode[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  maxJobsPerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  maxJobsPerSlot?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  workDayStartHour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  workDayEndHour?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
