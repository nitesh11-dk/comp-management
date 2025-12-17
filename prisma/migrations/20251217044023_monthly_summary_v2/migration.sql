/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,cycleStart]` on the table `MonthlyAttendanceSummary` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `daysAbsent` to the `MonthlyAttendanceSummary` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "MonthlyAttendanceSummary_employeeId_cycleStart_idx";

-- AlterTable
ALTER TABLE "MonthlyAttendanceSummary" ADD COLUMN     "advanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "daysAbsent" INTEGER NOT NULL,
ADD COLUMN     "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "pfAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyAttendanceSummary_employeeId_cycleStart_key" ON "MonthlyAttendanceSummary"("employeeId", "cycleStart");
