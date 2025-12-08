// src/admin/dto/update-driver.dto.ts

import { RegionCode } from '../../../generated/prisma/client';



import {
  IsArray,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateDriverDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  currentStatus?: 'offline' | 'available' | 'on_job';

  @IsOptional()
  @IsNumber()
  maxJobsPerDay?: number;

  @IsOptional()
  @IsNumber()
  maxJobsPerSlot?: number;

  @IsOptional()
  @IsNumber()
  workDayStartHour?: number;

  @IsOptional()
  @IsNumber()
  workDayEndHour?: number;

  @IsOptional()
  @IsEnum(RegionCode)
  primaryRegion?: RegionCode;

  @IsOptional()
  @IsArray()
  @IsEnum(RegionCode, { each: true })
  secondaryRegions?: RegionCode[];

  @IsOptional()
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @IsNumber()
  locationLng?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
