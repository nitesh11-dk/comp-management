/*
  Warnings:

  - You are about to drop the column `grossSalary` on the `MonthlyAttendanceSummary` table. All the data in the column will be lost.
  - You are about to drop the column `pfAmount` on the `MonthlyAttendanceSummary` table. All the data in the column will be lost.
  - Made the column `deductions` on table `MonthlyAttendanceSummary` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "MonthlyAttendanceSummary" DROP COLUMN "grossSalary",
DROP COLUMN "pfAmount",
ALTER COLUMN "deductions" SET NOT NULL,
ALTER COLUMN "deductions" SET DEFAULT '{"shoes":0,"canteen":0}';
