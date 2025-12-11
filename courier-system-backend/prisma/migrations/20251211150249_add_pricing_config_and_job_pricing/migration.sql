-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SGD',
ADD COLUMN     "finalPriceCents" INTEGER,
ADD COLUMN     "pricingBreakdown" JSONB,
ADD COLUMN     "quotedPriceCents" INTEGER;

-- AlterTable
ALTER TABLE "JobStop" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PricingConfig" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "baseDistanceKm" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "baseFeeCents" INTEGER NOT NULL DEFAULT 500,
    "perKmRateCents" INTEGER NOT NULL DEFAULT 80,
    "longHaulThresholdKm" DOUBLE PRECISION NOT NULL DEFAULT 25.0,
    "longHaulPerKmRateCents" INTEGER NOT NULL DEFAULT 120,
    "additionalStopFeeCents" INTEGER NOT NULL DEFAULT 300,
    "vehicleMultipliers" JSONB,
    "categorySurcharges" JSONB,
    "weightBands" JSONB,
    "peakHourWindows" JSONB,
    "miscAddOns" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id")
);
