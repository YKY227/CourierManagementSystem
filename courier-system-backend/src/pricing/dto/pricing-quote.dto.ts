// src/pricing/dto/pricing-quote.dto.ts
import { IsArray, IsNumber, IsOptional,IsBoolean, IsString, ValidateNested, IsIn } from "class-validator";
import { Type } from "class-transformer";

export class QuoteStopDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  type: string; // "pickup" | "delivery" | "return" (we'll accept free-form and just use order)
}

export class DimensionsDto {
  @IsNumber()
  length: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}

export class PricingQuoteRequestDto {
  @IsString()
  @IsIn(["motorcycle", "car", "van", "lorry"])
  vehicleType: string;

  @IsString()
  itemCategory: string; // "Document", "Parcel", "Fragile", ...

  @IsNumber()
  actualWeightKg: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensionsCm?: DimensionsDto;

  @IsString()
  pickupDateTime: string; // ISO string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteStopDto)
  stops: QuoteStopDto[];

  @IsBoolean()
  @IsOptional()
  isAdHocService?: boolean;

  @IsBoolean()
  @IsOptional()
  hasSpecialHandling?: boolean;
}

export interface PricingBreakdown {
  baseFeeCents: number;
  distanceKm: number;
  distanceChargeCents: number;
  weightChargeCents: number;
  categorySurchargeCents: number;
  vehicleSurchargeCents: number;
  peakHourSurchargeCents: number;
  multiStopChargeCents: number;
  manualAddOnCents: number;
}

export interface PricingQuoteResponse {
  currency: string;
  totalPriceCents: number;
  totalDistanceKm: number;
  breakdown: PricingBreakdown;
}
