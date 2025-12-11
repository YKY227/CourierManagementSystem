-- AlterTable
ALTER TABLE "PricingConfig" ADD COLUMN     "adHocServiceFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "specialHandlingFeeCents" INTEGER NOT NULL DEFAULT 0;
