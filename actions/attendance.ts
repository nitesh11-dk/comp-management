// app/actions/attendance.ts
"use server";

import mongoose from "mongoose";
import AttendanceWalletModel, { IAttendanceWallet, IAttendanceEntry } from "@/lib/models/EmployeeAttendanceWallet";
import Employee from "@/lib/models/Employee";
import { getUserFromCookies } from "@/lib/auth";

// ================================
// 🔹 Get full attendance wallet
// ================================
export async function getAttendanceWallet(employeeId: mongoose.Types.ObjectId): Promise<IAttendanceWallet | null> {
    const wallet = await AttendanceWalletModel.findOne({ employeeId });
    return wallet ? wallet.toObject() : null; // convert to plain object
}

// ================================
// 🔹 Scan Attendance (IN/OUT)
// ================================
export interface ScanAttendanceInput {
    empCode: string;
}

export interface ScanResult {
    employeeId: mongoose.Types.ObjectId;
    lastScanType: "in" | "out";
}

export async function scanEmployee(input: ScanAttendanceInput): Promise<ScanResult> {
    const user = await getUserFromCookies();
    if (!user) throw new Error("Unauthorized");

    const { empCode } = input;
    const employee = await Employee.findOne({ empCode });
    if (!employee) throw new Error("Employee not found");

    const employeeId = employee._id;
    let wallet = await AttendanceWalletModel.findOne({ employeeId });
    if (!wallet) wallet = new AttendanceWalletModel({ employeeId, entries: [] });

    const now = new Date();
    const lastEntry = [...wallet.entries].reverse().find(e => e.departmentId.equals(user.departmentId));
    let newScanType: "in" | "out" = "in";
    if (lastEntry?.scanType === "in") newScanType = "out";

    // Auto-close IN from another department
    if (newScanType === "in" && lastEntry?.scanType === "in" && !lastEntry.departmentId.equals(user.departmentId)) {
        wallet.entries.push({
            timestamp: new Date(now.getTime() - 1000),
            scanType: "out",
            departmentId: lastEntry.departmentId,
            scannedBy: new mongoose.Types.ObjectId(user.id),
            autoClosed: true,
        });
    }

    wallet.entries.push({
        timestamp: now,
        scanType: newScanType,
        departmentId: new mongoose.Types.ObjectId(user.departmentId),
        scannedBy: new mongoose.Types.ObjectId(user.id),
    });

    await wallet.save();
    return { employeeId, lastScanType: newScanType };
}

// ================================
// 🔹 Calculate Work Logs
// ================================
export async function calculateWorkLogs(entries: IAttendanceEntry[], hourlyRate: number = 100) {
    const workLogMap: Record<string, { totalMinutes: number; departmentId: string; date: string }> = {};
    const sortedEntries = [...entries].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let lastIn: IAttendanceEntry | null = null;

    for (const entry of sortedEntries) {
        const entryTime = new Date(entry.timestamp);

        if (entry.scanType === "in") {
            lastIn = entry;
        } else if (entry.scanType === "out" && lastIn && !entry.autoClosed) {
            const lastDeptId = lastIn.departmentId.toString();
            const currentDeptId = entry.departmentId.toString();

            if (lastDeptId === currentDeptId) {
                const durationMinutes = Math.round(
                    (entryTime.getTime() - new Date(lastIn.timestamp).getTime()) / (1000 * 60)
                );

                const dateKey = new Date(lastIn.timestamp).toLocaleDateString("en-CA");
                const key = `${currentDeptId}_${dateKey}`;

                if (!workLogMap[key]) {
                    workLogMap[key] = { totalMinutes: 0, departmentId: currentDeptId, date: dateKey };
                }
                workLogMap[key].totalMinutes += durationMinutes;
                lastIn = null;
            }
        }
    }

    return Object.values(workLogMap).map(v => {
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


// ================================
// 🔹 Add test entries
// ================================
export async function addTestEntries(employeeId: mongoose.Types.ObjectId) {
    const wallet = await AttendanceWalletModel.findOne({ employeeId });
    if (!wallet) throw new Error("Attendance wallet not found");

    const testEntries: IAttendanceEntry[] = [
        // October
        {
            timestamp: new Date("2025-10-04T09:15:00Z"), // 9:15 AM
            scanType: "in",
            departmentId: wallet.entries[0]?.departmentId || new mongoose.Types.ObjectId(),
            scannedBy: wallet.entries[0]?.scannedBy || new mongoose.Types.ObjectId(),
            autoClosed: false
        },
        {
            timestamp: new Date("2025-10-04T19:10:00Z"), // 10 hrs 55 mins
            scanType: "out",
            departmentId: wallet.entries[0]?.departmentId || new mongoose.Types.ObjectId(),
            scannedBy: wallet.entries[0]?.scannedBy || new mongoose.Types.ObjectId(),
            autoClosed: false
        },
        {
            timestamp: new Date("2025-10-08T08:45:00Z"), // 8:45 AM
            scanType: "in",
            departmentId: wallet.entries[0]?.departmentId || new mongoose.Types.ObjectId(),
            scannedBy: wallet.entries[0]?.scannedBy || new mongoose.Types.ObjectId(),
            autoClosed: false
        },
        {
            timestamp: new Date("2025-10-08T12:50:00Z"), // 4 hrs 5 mins
            scanType: "out",
            departmentId: wallet.entries[0]?.departmentId || new mongoose.Types.ObjectId(),
            scannedBy: wallet.entries[0]?.scannedBy || new mongoose.Types.ObjectId(),
            autoClosed: false
        },

        // September
        {
            timestamp: new Date("2025-09-10T08:40:00Z"), // 8:40 AM
            scanType: "in",
            departmentId: wallet.entries[0]?.departmentId || new mongoose.Types.ObjectId(),
            scannedBy: wallet.entries[0]?.scannedBy || new mongoose.Types.ObjectId(),
            autoClosed: false
        },
        {
            timestamp: new Date("2025-09-10T16:30:00Z"), // 7 hrs 50 mins
            scanType: "out",
            departmentId: wallet.entries[0]?.departmentId || new mongoose.Types.ObjectId(),
            scannedBy: wallet.entries[0]?.scannedBy || new mongoose.Types.ObjectId(),
            autoClosed: false
        },
        {
            timestamp: new Date("2025-09-15T09:10:00Z"), // 9:10 AM
            scanType: "in",
            departmentId: wallet.entries[0]?.departmentId || new mongoose.Types.ObjectId(),
            scannedBy: wallet.entries[0]?.scannedBy || new mongoose.Types.ObjectId(),
            autoClosed: false
        },
        {
            timestamp: new Date("2025-09-15T14:20:00Z"), // 5 hrs 10 mins
            scanType: "out",
            departmentId: wallet.entries[0]?.departmentId || new mongoose.Types.ObjectId(),
            scannedBy: wallet.entries[0]?.scannedBy || new mongoose.Types.ObjectId(),
            autoClosed: false
        },

        // August
        {
            timestamp: new Date("2025-08-20T10:05:00Z"), // 10:05 AM
            scanType: "in",
            departmentId: wallet.entries[0]?.departmentId || new mongoose.Types.ObjectId(),
            scannedBy: wallet.entries[0]?.scannedBy || new mongoose.Types.ObjectId(),
            autoClosed: false
        },
        {
            timestamp: new Date("2025-08-20T18:15:00Z"), // 8 hrs 10 mins
            scanType: "out",
            departmentId: wallet.entries[0]?.departmentId || new mongoose.Types.ObjectId(),
            scannedBy: wallet.entries[0]?.scannedBy || new mongoose.Types.ObjectId(),
            autoClosed: false
        }
    ];



    wallet.entries.push(...testEntries);
    await wallet.save();
    return wallet.toObject(); // convert to plain object for Client Components
}
