// src/pricing/pricing.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { PricingQuoteRequestDto, PricingQuoteResponse, PricingBreakdown } from "./dto/pricing-quote.dto";

type VehicleConfig = {
  multiplier: number;
  extraCents: number;
};

type VehicleMultipliersConfig = Record<string, VehicleConfig>;

type CategorySurchargesConfig = Record<string, number>;

type WeightBandConfig = {
  minKg: number;
  maxKg: number | null;
  priceCents?: number;
  perKgCents?: number;
};

type PeakWindowConfig = {
  startHour: number;        // 0–23
  endHour: number;          // 0–23 (end exclusive)
  surchargeCents: number;
};

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // Config helpers
  // ─────────────────────────────────────────────
  private async getOrCreateConfig() {
    let config = await this.prisma.pricingConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      this.logger.warn("No PricingConfig found; seeding default config");
      config = await this.prisma.pricingConfig.create({
        data: {
          isActive: true,
          baseDistanceKm: 3,
          baseFeeCents: 500,
          perKmRateCents: 80,
          longHaulThresholdKm: 25,
          longHaulPerKmRateCents: 120,
          additionalStopFeeCents: 300,
          currency: "SGD",
          vehicleMultipliers: {
            motorcycle: { multiplier: 1.0, extraCents: 0 },
            car: { multiplier: 1.2, extraCents: 300 },
            van: { multiplier: 1.5, extraCents: 800 },
            lorry: { multiplier: 2.0, extraCents: 1500 },
          },
          categorySurcharges: {
            Document: 0,
            Parcel: 100,
            Fragile: 300,
            Electronics: 200,
            "Food / Perishable": 300,
            Liquid: 200,
            Oversized: 1000,
            Other: 100,
          },
          weightBands: [
            { minKg: 0, maxKg: 1, priceCents: 500 },
            { minKg: 1, maxKg: 3, priceCents: 700 },
            { minKg: 3, maxKg: 5, priceCents: 1000 },
            { minKg: 5, maxKg: 10, priceCents: 1500 },
            { minKg: 10, maxKg: null, perKgCents: 150 },
          ],
          peakHourWindows: [
            { startHour: 11, endHour: 14, surchargeCents: 200 },
            { startHour: 17, endHour: 20, surchargeCents: 200 },
          ],
        },
      });
    }

    return config;
  }

  async getConfigForAdmin() {
    const config = await this.getOrCreateConfig();
    return config;
  }

  async updateConfigFromAdmin(update: Partial<Parameters<typeof this.prisma.pricingConfig.update>[0]["data"]>) {
    const config = await this.getOrCreateConfig();
    const updated = await this.prisma.pricingConfig.update({
      where: { id: config.id },
      data: update,
    });
    return updated;
  }

  // ─────────────────────────────────────────────
  // Haversine distance
  // ─────────────────────────────────────────────
  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private estimateRouteDistanceKm(
    stops: { latitude: number; longitude: number }[],
  ): { totalDistanceKm: number } {
    if (stops.length < 2) {
      return { totalDistanceKm: 0 };
    }

    let total = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      const leg = this.haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
      total += leg;
    }

    return { totalDistanceKm: total };
  }

  // ─────────────────────────────────────────────
  // Weight / DIM helpers
  // ─────────────────────────────────────────────
  private computeChargeableWeightKg(
    actualWeightKg: number,
    dimensionsCm?: { length: number; width: number; height: number },
  ): number {
    if (!dimensionsCm) return actualWeightKg;

    const { length, width, height } = dimensionsCm;
    const volumeCm3 = length * width * height;
    const dimDivisor = 5000; // typical courier divisor
    const dimWeight = volumeCm3 / dimDivisor;
    return Math.max(actualWeightKg, dimWeight);
  }

  private computeWeightChargeCents(
    chargeableWeightKg: number,
    weightBands: WeightBandConfig[],
  ): number {
    for (const band of weightBands) {
      const min = band.minKg;
      const max = band.maxKg;
      if (chargeableWeightKg >= min && (max === null || chargeableWeightKg < max)) {
        if (band.priceCents != null) {
          return band.priceCents;
        }
        if (band.perKgCents != null) {
          return Math.round(chargeableWeightKg * band.perKgCents);
        }
      }
    }
    return 0;
  }

  private computePeakHourSurcharge(
    pickupDateTime: string,
    windows: PeakWindowConfig[],
  ): number {
    if (!windows || windows.length === 0) return 0;

    const date = new Date(pickupDateTime);
    if (Number.isNaN(date.getTime())) return 0;

    const hour = date.getHours(); // local hour

    for (const w of windows) {
      const start = w.startHour;
      const end = w.endHour;
      if (hour >= start && hour < end) {
        return w.surchargeCents;
      }
    }

    return 0;
  }

  // ─────────────────────────────────────────────
  // Public quote function
  // ─────────────────────────────────────────────
  async calculateQuote(dto: PricingQuoteRequestDto): Promise<PricingQuoteResponse> {
    const config = await this.getOrCreateConfig();

    const stops = dto.stops ?? [];
    if (stops.length < 2) {
      this.logger.warn("calculateQuote called with <2 stops; distance = 0");
    }

    const { totalDistanceKm } = this.estimateRouteDistanceKm(stops);

    // Distance pricing
    let distanceChargeCents = 0;
    const d = totalDistanceKm;
    const baseKm = config.baseDistanceKm;
    const baseFee = config.baseFeeCents;
    const perKm = config.perKmRateCents;
    const longHaulThreshold = config.longHaulThresholdKm;
    const longHaulRate = config.longHaulPerKmRateCents;

    const withinBase = Math.min(d, Math.max(baseKm, 0));
    const remainingAfterBase = Math.max(d - withinBase, 0);
    const withinLongHaul = Math.min(remainingAfterBase, Math.max(longHaulThreshold - baseKm, 0));
    const beyondLongHaul = Math.max(d - longHaulThreshold, 0);

    distanceChargeCents += Math.round(withinLongHaul * perKm);
    distanceChargeCents += Math.round(beyondLongHaul * longHaulRate);

    // Weight
    const vehicleMultipliers = (config.vehicleMultipliers ?? {}) as VehicleMultipliersConfig;
    const categorySurcharges = (config.categorySurcharges ?? {}) as CategorySurchargesConfig;
    const weightBands = (config.weightBands ?? []) as WeightBandConfig[];
    const peakWindows = (config.peakHourWindows ?? []) as PeakWindowConfig[];

    const chargeableWeightKg = this.computeChargeableWeightKg(dto.actualWeightKg, dto.dimensionsCm);
    const weightChargeCents = this.computeWeightChargeCents(chargeableWeightKg, weightBands);

    // Category
    const categorySurchargeCents =
      categorySurcharges[dto.itemCategory] ?? 0;

    // Vehicle
    const vehicleCfg = vehicleMultipliers[dto.vehicleType] ?? {
      multiplier: 1.0,
      extraCents: 0,
    };

    // Multi-stop: assume 1 pickup + 1 drop included,
    // each additional stop beyond 2 charged.
    const extraStops = Math.max(stops.length - 2, 0);
    const multiStopChargeCents = extraStops * config.additionalStopFeeCents;

    // Peak hour
    const peakHourSurchargeCents = this.computePeakHourSurcharge(
      dto.pickupDateTime,
      peakWindows,
    );

     // 🔧 manual add-ons (ad hoc + special handling)
    let manualAddOnCents = 0;

    // ad hoc service fee (e.g. 3-Hour Express)
    if (dto.isAdHocService && config.adHocServiceFeeCents) {
      manualAddOnCents += config.adHocServiceFeeCents;
    }

    // special handling fee (once per booking)
    if (dto.hasSpecialHandling && config.specialHandlingFeeCents) {
      manualAddOnCents += config.specialHandlingFeeCents;
    }

    // Sum core components before vehicle multiplier
    let subtotalCents =
      baseFee +
      distanceChargeCents +
      weightChargeCents +
      categorySurchargeCents +
      multiStopChargeCents +
      peakHourSurchargeCents +
      manualAddOnCents;

    // Apply vehicle multiplier & extra
    subtotalCents = Math.round(subtotalCents * vehicleCfg.multiplier) + vehicleCfg.extraCents;

    const breakdown: PricingBreakdown = {
      baseFeeCents: baseFee,
      distanceKm: d,
      distanceChargeCents,
      weightChargeCents,
      categorySurchargeCents,
      vehicleSurchargeCents: Math.round(subtotalCents) - (
        baseFee +
        distanceChargeCents +
        weightChargeCents +
        categorySurchargeCents +
        multiStopChargeCents +
        peakHourSurchargeCents +
        manualAddOnCents
      ),
      peakHourSurchargeCents,
      multiStopChargeCents,
      manualAddOnCents,
    };

    return {
      currency: config.currency,
      totalPriceCents: Math.max(subtotalCents, 0),
      totalDistanceKm: d,
      breakdown,
    };
  }
}
