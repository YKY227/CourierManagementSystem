-- CreateEnum
CREATE TYPE "RegionCode" AS ENUM ('central', 'east', 'west', 'north', 'north_east', 'island_wide');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('bike', 'car', 'van', 'lorry');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('scheduled', 'ad_hoc');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('booked', 'pending_assign', 'assigned', 'out_for_pickup', 'in_transit', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('offline', 'available', 'on_job');

-- CreateEnum
CREATE TYPE "AssignmentMode" AS ENUM ('auto', 'manual');

-- CreateEnum
CREATE TYPE "AssignmentFailureReason" AS ENUM ('NO_ELIGIBLE_DRIVER', 'NO_CAPACITY', 'OUTSIDE_WORKING_HOURS', 'REGION_MISMATCH', 'VEHICLE_MISMATCH', 'OTHER');

-- CreateEnum
CREATE TYPE "JobStopType" AS ENUM ('PICKUP', 'DROPOFF', 'RETURN');

-- CreateEnum
CREATE TYPE "JobStopStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "vehicleType" "VehicleType" NOT NULL,
    "vehiclePlate" TEXT,
    "primaryRegion" "RegionCode" NOT NULL,
    "secondaryRegions" "RegionCode"[],
    "maxJobsPerDay" INTEGER NOT NULL,
    "maxJobsPerSlot" INTEGER NOT NULL,
    "workDayStartHour" INTEGER NOT NULL,
    "workDayEndHour" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentStatus" "DriverStatus" NOT NULL DEFAULT 'offline',
    "lastSeenAt" TIMESTAMP(3),
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "authUserId" TEXT,
    "assignedJobCountToday" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "serviceType" TEXT,
    "routeType" TEXT,
    "pickupRegion" "RegionCode" NOT NULL,
    "pickupDate" TIMESTAMP(3),
    "pickupSlot" TEXT,
    "stopsCount" INTEGER NOT NULL DEFAULT 0,
    "totalBillableWeightKg" DECIMAL(10,2),
    "jobType" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'booked',
    "assignmentMode" "AssignmentMode",
    "assignmentFailureReason" "AssignmentFailureReason",
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentDriverId" TEXT,
    "pickupDetails" JSONB,
    "deliveryPoints" JSONB,
    "items" JSONB,
    "scheduleInfo" JSONB,
    "assignmentScoreDebug" JSONB,
    "hardConstraintResults" JSONB,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobStop" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "sequenceIndex" INTEGER NOT NULL,
    "type" "JobStopType" NOT NULL,
    "label" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "postalCode" TEXT,
    "region" "RegionCode" NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "status" "JobStopStatus" NOT NULL DEFAULT 'PENDING',
    "proofPhotoUrl" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedByDriverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "mode" "AssignmentMode" NOT NULL,
    "failureReason" "AssignmentFailureReason",
    "totalScore" DOUBLE PRECISION,
    "scoreComponents" JSONB,
    "hardConstraintResults" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "demoMode" BOOLEAN NOT NULL DEFAULT false,
    "autoAssignScheduled" BOOLEAN NOT NULL DEFAULT false,
    "emailFromAddress" TEXT,
    "supportEmail" TEXT,
    "assignmentConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofPhoto" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stopId" TEXT,
    "driverId" TEXT,
    "url" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_publicId_key" ON "Job"("publicId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_pickupDate_idx" ON "Job"("pickupDate");

-- CreateIndex
CREATE INDEX "Job_pickupRegion_idx" ON "Job"("pickupRegion");

-- CreateIndex
CREATE INDEX "JobStop_jobId_sequenceIndex_idx" ON "JobStop"("jobId", "sequenceIndex");

-- CreateIndex
CREATE INDEX "JobAssignment_jobId_idx" ON "JobAssignment"("jobId");

-- CreateIndex
CREATE INDEX "JobAssignment_driverId_idx" ON "JobAssignment"("driverId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_currentDriverId_fkey" FOREIGN KEY ("currentDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobStop" ADD CONSTRAINT "JobStop_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobStop" ADD CONSTRAINT "JobStop_completedByDriverId_fkey" FOREIGN KEY ("completedByDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofPhoto" ADD CONSTRAINT "ProofPhoto_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofPhoto" ADD CONSTRAINT "ProofPhoto_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "JobStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofPhoto" ADD CONSTRAINT "ProofPhoto_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
