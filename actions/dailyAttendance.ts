"use server";

import prisma from "@/lib/prisma";

export interface DailyEmployeeRecord {
    employeeId: string;
    empCode: string;
    name: string;
    departmentId: string;
    departmentName: string;
    isPresent: boolean;
    firstIn: Date | null;
    lastOut: Date | null;
    totalMinutes: number;
    totalHours: number;
    formattedHours: string; // e.g. "7h 30m"
    scanCount: number;
}

export interface DailySummary {
    date: string;
    departmentId: string | null;
    totalEmployees: number;
    presentCount: number;
    absentCount: number;
    avgHoursWorked: number;
    records: DailyEmployeeRecord[];
}

export async function getDailyAttendanceSummary(
    date: string, // "YYYY-MM-DD"
    departmentId: string | null
): Promise<DailySummary> {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    // Fetch all employees (optionally filtered by dept)
    const employees = await prisma.employee.findMany({
        where: departmentId ? { departmentId } : {},
        select: {
            id: true,
            empCode: true,
            name: true,
            departmentId: true,
            department: { select: { name: true } },
            attendanceWallet: {
                select: {
                    id: true,
                    entries: {
                        where: {
                            timestamp: { gte: dayStart, lte: dayEnd },
                        },
                        orderBy: { timestamp: "asc" },
                        select: {
                            id: true,
                            timestamp: true,
                            scanType: true,
                            departmentId: true,
                            autoClosed: true,
                        },
                    },
                },
            },
        },
        orderBy: [{ name: "asc" }],
    });

    const records: DailyEmployeeRecord[] = employees.map((emp) => {
        const entries = emp.attendanceWallet?.entries ?? [];
        const isPresent = entries.length > 0;

        // Calculate hours worked using IN/OUT pairs
        let totalMinutes = 0;
        let lastIn: { timestamp: Date; departmentId: string } | null = null;
        let firstIn: Date | null = null;
        let lastOut: Date | null = null;

        for (const entry of entries) {
            if (entry.scanType === "in") {
                lastIn = { timestamp: entry.timestamp, departmentId: entry.departmentId };
                if (!firstIn) firstIn = entry.timestamp;
            } else if (entry.scanType === "out" && lastIn) {
                const durationMs = entry.timestamp.getTime() - lastIn.timestamp.getTime();
                if (durationMs > 0 && durationMs < 24 * 60 * 60 * 1000) {
                    // Sanity: only count if < 24h
                    totalMinutes += Math.round(durationMs / 60000);
                }
                lastOut = entry.timestamp;
                lastIn = null;
            }
        }

        // If still clocked in (no matching OUT), count till end of day
        if (lastIn) {
            const effectiveEnd = dayEnd < new Date() ? dayEnd : new Date();
            const durationMs = effectiveEnd.getTime() - lastIn.timestamp.getTime();
            if (durationMs > 0 && durationMs < 24 * 60 * 60 * 1000) {
                totalMinutes += Math.round(durationMs / 60000);
            }
        }

        const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const formattedHours = isPresent
            ? h > 0
                ? `${h}h ${m}m`
                : `${m}m`
            : "—";

        return {
            employeeId: emp.id,
            empCode: emp.empCode,
            name: emp.name,
            departmentId: emp.departmentId,
            departmentName: emp.department?.name ?? "Unknown",
            isPresent,
            firstIn,
            lastOut,
            totalMinutes,
            totalHours,
            formattedHours,
            scanCount: entries.length,
        };
    });

    const presentCount = records.filter((r) => r.isPresent).length;
    const presentHours = records.filter((r) => r.isPresent && r.totalHours > 0).map((r) => r.totalHours);
    const avgHoursWorked =
        presentHours.length > 0
            ? Math.round((presentHours.reduce((a, b) => a + b, 0) / presentHours.length) * 100) / 100
            : 0;

    return {
        date,
        departmentId,
        totalEmployees: records.length,
        presentCount,
        absentCount: records.length - presentCount,
        avgHoursWorked,
        records,
    };
}
