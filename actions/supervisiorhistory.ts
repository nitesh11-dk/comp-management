"use server";

import prisma from "@/lib/prisma";
import { getUserFromCookies } from "@/lib/auth";

export type SupervisorScanLog = {
    employeeId: string;
    employeeName: string;
    departmentId: string;
    departmentName: string;
    scanType: "in" | "out";
    timestamp: Date;
    autoClosed?: boolean;
};

export async function getSupervisorScans(): Promise<SupervisorScanLog[]> {
    // 🔹 Validate user
    const supervisor = await getUserFromCookies();
    if (!supervisor) throw new Error("Unauthorized");

    const supervisorId = supervisor.id;

    // 🔹 Fetch all wallets + entries scanned by this supervisor
    const wallets = await prisma.attendanceWallet.findMany({
        include: {
            employee: true, // get employee.name
            entries: {
                include: {
                    department: true, // get department.name
                }
            }
        }
    });

    const logs: SupervisorScanLog[] = [];

    // 🔹 Flatten entries scanned by this supervisor
    for (const wallet of wallets) {
        for (const entry of wallet.entries) {
            if (entry.scannedBy !== supervisorId) continue;

            logs.push({
                employeeId: wallet.employeeId,
                employeeName: wallet.employee?.name ?? "Unknown",

                departmentId: entry.departmentId ?? "",
                departmentName: entry.department?.name ?? "Unknown",

                scanType: entry.scanType as "in" | "out",
                timestamp: entry.timestamp,
                autoClosed: entry.autoClosed ?? false,
            });
        }
    }

    // 🔹 Sort (latest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return logs;
}
