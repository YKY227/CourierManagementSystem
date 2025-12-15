/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_code_key" ON "Driver"("code");
