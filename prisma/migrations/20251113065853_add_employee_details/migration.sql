/*
  Warnings:

  - A unique constraint covering the columns `[panNumber]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "advanceCanteenAmount" DOUBLE PRECISION,
ADD COLUMN     "advanceCanteenEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "advanceShoesAmount" DOUBLE PRECISION,
ADD COLUMN     "advanceShoesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "currentAddress" TEXT,
ADD COLUMN     "cycleTimingId" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "esicActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ifscCode" TEXT,
ADD COLUMN     "panNumber" TEXT,
ADD COLUMN     "permanentAddress" TEXT,
ADD COLUMN     "pfActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "CycleTiming" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDay" INTEGER NOT NULL,
    "lengthDays" INTEGER NOT NULL DEFAULT 30,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CycleTiming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyAttendanceSummary" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "cycleStart" TIMESTAMP(3) NOT NULL,
    "cycleEnd" TIMESTAMP(3) NOT NULL,
    "daysInCycle" INTEGER NOT NULL,
    "daysPresent" INTEGER NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "grossSalary" DOUBLE PRECISION NOT NULL,
    "deductions" JSONB,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyAttendanceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyAttendanceSummary_employeeId_cycleStart_idx" ON "MonthlyAttendanceSummary"("employeeId", "cycleStart");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_panNumber_key" ON "Employee"("panNumber");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_cycleTimingId_fkey" FOREIGN KEY ("cycleTimingId") REFERENCES "CycleTiming"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAttendanceSummary" ADD CONSTRAINT "MonthlyAttendanceSummary_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
