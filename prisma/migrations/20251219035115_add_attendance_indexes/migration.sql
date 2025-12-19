-- CreateIndex
CREATE INDEX "AttendanceEntry_walletId_idx" ON "AttendanceEntry"("walletId");

-- CreateIndex
CREATE INDEX "AttendanceEntry_timestamp_idx" ON "AttendanceEntry"("timestamp");

-- CreateIndex
CREATE INDEX "AttendanceEntry_walletId_timestamp_idx" ON "AttendanceEntry"("walletId", "timestamp");
