// app/actions/attendance.ts
"use server";

import prisma from "@/lib/prisma";
import { getUserFromCookies } from "@/lib/auth";

export interface ScanAttendanceInput {
    empCode: string;
}

export interface ScanResult {
    employeeId: string;
    lastScanType: "in" | "out";
}

export type RawEntry = {
    id: string;
    timestamp: Date;
    scanType: "in" | "out";
    departmentId: string;
    scannedBy: string;
    autoClosed: boolean;
};

//
// ---------------------- Get full attendance wallet ----------------------
//
export async function getAttendanceWallet(
    employeeId: string
): Promise<{ id: string; employeeId: string; entries: RawEntry[] } | null> {
    const wallet = await prisma.attendanceWallet.findUnique({
        where: { employeeId },
        include: {
            entries: {
                orderBy: { timestamp: "asc" },
                include: { department: true, user: true },
            },
        },
    });

    if (!wallet) return null;

    return {
        id: wallet.id,
        employeeId: wallet.employeeId,
        entries: wallet.entries.map((e) => ({
            id: e.id,
            timestamp: e.timestamp,
            scanType: e.scanType as "in" | "out",
            departmentId: e.departmentId,
            scannedBy: e.scannedBy,
            autoClosed: e.autoClosed,
        })),
    };
}

//
// ---------------------- Scan Attendance (IN/OUT) ----------------------
//
export async function scanEmployee(input: ScanAttendanceInput): Promise<ScanResult> {
    const user = await getUserFromCookies();
    if (!user) throw new Error("Unauthorized");

    const { empCode } = input;

    // find employee by empCode
    const employee = await prisma.employee.findUnique({
        where: { empCode },
        select: { id: true, departmentId: true },
    });
    if (!employee) throw new Error("Employee not found");

    const employeeId = employee.id;

    // find or create wallet
    let wallet = await prisma.attendanceWallet.findUnique({
        where: { employeeId },
        include: {
            entries: {
                orderBy: { timestamp: "asc" }, // older -> newer
            },
        },
    });

    if (!wallet) {
        wallet = await prisma.attendanceWallet.create({
            data: { employeeId },
            include: {
                entries: true,
            },
        });
    }

    // find last entry for this employee (the latest entry)
    const lastEntry = wallet.entries.length > 0 ? wallet.entries[wallet.entries.length - 1] : null;

    const userDeptId = user.departmentId;
    if (!userDeptId) throw new Error("Your user has no department assigned");

    let newScanType: "in" | "out" = "in";
    if (lastEntry && lastEntry.scanType === "in") {
        // if last was "in" then this should be "out"
        newScanType = "out";
    } else {
        newScanType = "in";
    }

    const now = new Date();

    // Auto-close IN from another department:
    // If we're inserting an IN and lastEntry exists and lastEntry.scanType === "in"
    // but lastEntry.departmentId !== user.departmentId, create an autoClosed OUT entry
    // for the lastEntry.departmentId just before the new IN.
    if (
        newScanType === "in" &&
        lastEntry &&
        lastEntry.scanType === "in" &&
        lastEntry.departmentId !== userDeptId
    ) {
        // create auto-closed OUT entry with timestamp 1 second before now
        await prisma.attendanceEntry.create({
            data: {
                timestamp: new Date(now.getTime() - 1000),
                scanType: "out",
                departmentId: lastEntry.departmentId,
                scannedBy: user.id,
                autoClosed: true,
                walletId: wallet.id,
            },
        });
    }

    // create the actual new scan entry
    const created = await prisma.attendanceEntry.create({
        data: {
            timestamp: now,
            scanType: newScanType,
            departmentId: userDeptId,
            scannedBy: user.id,
            autoClosed: false,
            walletId: wallet.id,
        },
    });

    return { employeeId, lastScanType: created.scanType as "in" | "out" };
}

//
// ---------------------- Calculate Work Logs ----------------------
//
export async function calculateWorkLogs(
    entries: RawEntry[],
    hourlyRate: number = 100
) {
    const workLogMap: Record<string, { totalMinutes: number; departmentId: string; date: string }> = {};
    const sortedEntries = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let lastIn: RawEntry | null = null;

    for (const entry of sortedEntries) {
        const entryTime = new Date(entry.timestamp);

        if (entry.scanType === "in") {
            lastIn = entry;
        } else if (entry.scanType === "out" && lastIn && !entry.autoClosed) {
            const lastDeptId = lastIn.departmentId;
            const currentDeptId = entry.departmentId;

            if (lastDeptId === currentDeptId) {
                const durationMinutes = Math.round((entryTime.getTime() - new Date(lastIn.timestamp).getTime()) / (1000 * 60));
                const dateKey = new Date(lastIn.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD
                const key = `${currentDeptId}_${dateKey}`;

                if (!workLogMap[key]) {
                    workLogMap[key] = { totalMinutes: 0, departmentId: currentDeptId, date: dateKey };
                }
                workLogMap[key].totalMinutes += durationMinutes;
                lastIn = null;
            }
        }
    }

    return Object.values(workLogMap).map((v) => {
        const hours = Math.floor(v.totalMinutes / 60);
        const minutes = v.totalMinutes % 60;
        const totalHoursDecimal = Math.round((v.totalMinutes / 60) * 100) / 100;
        return {
            date: new Date(v.date),
            departmentId: v.departmentId,
            totalHours: totalHoursDecimal,
            hours,
            minutes,
            salaryEarned: Math.round(totalHoursDecimal * hourlyRate * 100) / 100,
        };
    });
}

//
// ---------------------- Add test entries ----------------------
//
export async function addTestEntries(employeeId: string) {
    // find wallet
    const wallet = await prisma.attendanceWallet.findUnique({
        where: { employeeId },
        include: { entries: { orderBy: { timestamp: "asc" } } },
    });

    if (!wallet) throw new Error("Attendance wallet not found");

    // we need at least one existing entry to derive a valid departmentId and scannedBy
    if (!wallet.entries || wallet.entries.length === 0) {
        throw new Error(
            "Cannot add test entries: wallet has no existing entries. Create at least one real attendance entry first so we can derive departmentId and scannedBy."
        );
    }

    const baseDeptId = wallet.entries[0].departmentId;
    const baseScannedBy = wallet.entries[0].scannedBy;

    // define helper to create entries
    const testEntries = [
        // October
        { timestamp: new Date("2025-10-04T09:15:00Z"), scanType: "in", departmentId: baseDeptId, scannedBy: baseScannedBy, autoClosed: false },
        { timestamp: new Date("2025-10-04T19:10:00Z"), scanType: "out", departmentId: baseDeptId, scannedBy: baseScannedBy, autoClosed: false },
        { timestamp: new Date("2025-10-08T08:45:00Z"), scanType: "in", departmentId: baseDeptId, scannedBy: baseScannedBy, autoClosed: false },
        { timestamp: new Date("2025-10-08T12:50:00Z"), scanType: "out", departmentId: baseDeptId, scannedBy: baseScannedBy, autoClosed: false },

        // September
        { timestamp: new Date("2025-09-10T08:40:00Z"), scanType: "in", departmentId: baseDeptId, scannedBy: baseScannedBy, autoClosed: false },
        { timestamp: new Date("2025-09-10T16:30:00Z"), scanType: "out", departmentId: baseDeptId, scannedBy: baseScannedBy, autoClosed: false },
        { timestamp: new Date("2025-09-15T09:10:00Z"), scanType: "in", departmentId: baseDeptId, scannedBy: baseScannedBy, autoClosed: false },
        { timestamp: new Date("2025-09-15T14:20:00Z"), scanType: "out", departmentId: baseDeptId, scannedBy: baseScannedBy, autoClosed: false },

        // August
        { timestamp: new Date("2025-08-20T10:05:00Z"), scanType: "in", departmentId: baseDeptId, scannedBy: baseScannedBy, autoClosed: false },
        { timestamp: new Date("2025-08-20T18:15:00Z"), scanType: "out", departmentId: baseDeptId, scannedBy: baseScannedBy, autoClosed: false },
    ];

    // create many (Prisma createMany doesn't support relational nested includes, but it's fine for simple entries)
    await prisma.attendanceEntry.createMany({
        data: testEntries.map((t: any) => ({
            timestamp: t.timestamp,
            scanType: t.scanType,
            departmentId: t.departmentId,
            scannedBy: t.scannedBy,
            autoClosed: t.autoClosed,
            walletId: wallet.id,
        })),
    });

    // return updated wallet
    const updated = await prisma.attendanceWallet.findUnique({
        where: { employeeId },
        include: { entries: { orderBy: { timestamp: "asc" }, include: { department: true, user: true } } },
    });

    return {
        id: updated!.id,
        employeeId: updated!.employeeId,
        entries: updated!.entries.map((e) => ({
            id: e.id,
            timestamp: e.timestamp,
            scanType: e.scanType,
            departmentId: e.departmentId,
            scannedBy: e.scannedBy,
            autoClosed: e.autoClosed,
        })),
    };
}
