-- DropForeignKey
ALTER TABLE "AttendanceEntry" DROP CONSTRAINT "AttendanceEntry_walletId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceWallet" DROP CONSTRAINT "AttendanceWallet_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "MonthlyAttendanceSummary" DROP CONSTRAINT "MonthlyAttendanceSummary_employeeId_fkey";

-- AddForeignKey
ALTER TABLE "MonthlyAttendanceSummary" ADD CONSTRAINT "MonthlyAttendanceSummary_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceEntry" ADD CONSTRAINT "AttendanceEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "AttendanceWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceWallet" ADD CONSTRAINT "AttendanceWallet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
