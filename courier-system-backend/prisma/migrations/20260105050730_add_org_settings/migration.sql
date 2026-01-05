-- CreateTable
CREATE TABLE "OrgSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "orgName" TEXT NOT NULL DEFAULT 'Courier Ops',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@example.com',
    "whatsappNumber" TEXT,
    "brandingLogoUrl" TEXT,
    "adminNotificationEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bccTesterEnabled" BOOLEAN NOT NULL DEFAULT false,
    "testerEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bookingPaidRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "overdueRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSettings_pkey" PRIMARY KEY ("id")
);
