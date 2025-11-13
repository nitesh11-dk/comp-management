"use server";

import prisma from "@/lib/prisma";
import { scanEmployee as scanEmployeeCore } from "@/actions/attendance";

export type ScanResult = {
    employeeName: string;
    empCode: string;
    lastScanType?: "in" | "out";
};

export async function scanEmployee(empCode: string): Promise<ScanResult> {
    // 1️⃣ Find employee by empCode (Prisma)
    const employee = await prisma.employee.findUnique({
        where: { empCode },
        select: { id: true, name: true, empCode: true },
    });

    if (!employee) {
        throw new Error("Employee not found with given EmpCode");
    }

    try {
        // 2️⃣ Perform scan (in/out auto logic)
        const result = await scanEmployeeCore({ empCode });

        return {
            empCode: employee.empCode,
            employeeName: employee.name,
            lastScanType: result.lastScanType,
        };
    } catch (err: any) {
        console.error("❌ Error scanning employee:", err);
        throw new Error(err.message || "Unknown error occurred while scanning employee");
    }
}

