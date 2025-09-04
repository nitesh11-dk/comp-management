// app/actions/attendance.ts (server)
import mongoose from "mongoose";
import AttendanceWalletModel, { IAttendanceWallet } from "@/lib/models/EmployeeAttendanceWallet";
import connect from "@/lib/mongo";
import { getUserFromCookies } from "@/lib/auth";

export async function getEmployeeAttendance(employeeId: string) {
    await connect(); // ensure DB connection
    const wallet = await AttendanceWalletModel.findOne({ employeeId: new mongoose.Types.ObjectId(employeeId) }).lean();
    return wallet;
}


export interface ScanAttendanceInput {
    employeeId: mongoose.Types.ObjectId; // employee being scanned
}

export interface ScanResult {
    employeeId: mongoose.Types.ObjectId;
    lastScanType: "in" | "out";
}

export async function scanEmployee(input: ScanAttendanceInput): Promise<ScanResult> {
    const user = await getUserFromCookies();
    if (!user) throw new Error("Unauthorized");

    const { employeeId } = input;

    // 🔹 Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        throw new Error("Invalid employeeId");
    }

    // 🔹 Find or create wallet
    let wallet = await AttendanceWalletModel.findOne({ employeeId });
    if (!wallet) {
        wallet = new AttendanceWalletModel({ employeeId, entries: [], workLogs: [] });
    }

    const now = new Date();

    // 🔹 Check last entry for this user's department
    const lastEntry = [...wallet.entries]
        .reverse()
        .find((e) => e.departmentId.equals(user.departmentId));

    let newScanType: "in" | "out" = "in";

    if (!lastEntry || lastEntry.scanType === "out") {
        newScanType = "in";
    } else if (lastEntry.scanType === "in") {
        newScanType = "out";
    }

    // 🔹 Auto-close previous IN from other department if necessary
    if (newScanType === "in" && lastEntry && lastEntry.scanType === "in" && !lastEntry.departmentId.equals(user.departmentId)) {
        wallet.entries.push({
            timestamp: new Date(now.getTime() - 1000),
            scanType: "out",
            departmentId: lastEntry.departmentId,
            scannedBy: new mongoose.Types.ObjectId(user.id),
            autoClosed: true,
        });
    }

    // 🔹 Add new entry using user's department and id
    wallet.entries.push({
        timestamp: now,
        scanType: newScanType,
        departmentId: new mongoose.Types.ObjectId(user.departmentId),
        scannedBy: new mongoose.Types.ObjectId(user.id),
    });

    await wallet.save();

    return { employeeId, lastScanType: newScanType };
}

// ---------------------------


// ================================
// 🔹 Get attendance wallet for employee
// ================================
export async function getAttendanceWallet(employeeId: mongoose.Types.ObjectId): Promise<IAttendanceWallet | null> {
    return await AttendanceWalletModel.findOne({ employeeId });
}

// ================================
// 🔹 Get weekly / monthly attendance for admin view
// ================================
export async function getAttendanceReport(
    employeeId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date
): Promise<IAttendanceWallet | null> {
    const wallet = await AttendanceWalletModel.findOne({ employeeId });
    if (!wallet) return null;

    // Filter entries in date range
    const filteredEntries = wallet.entries.filter(
        (e) => e.timestamp >= startDate && e.timestamp <= endDate
    );

    return {
        ...wallet.toObject(),
        entries: filteredEntries,
    } as IAttendanceWallet;
}

// ================================
// 🔹 Optional: Recalculate WorkLogs based on IN/OUT pairs
// ================================
export async function recalcWorkLogs(employeeId: mongoose.Types.ObjectId, hourlyRate: number = 100) {
    const wallet = await AttendanceWalletModel.findOne({ employeeId });
    if (!wallet) return null;

    const workLogMap: Record<string, { totalHours: number; departmentId: string }> = {};

    // Iterate entries pair-wise
    const entries = wallet.entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let lastIn: typeof entries[0] | null = null;

    for (const entry of entries) {
        if (entry.scanType === "in") {
            lastIn = entry;
        } else if (entry.scanType === "out" && lastIn && lastIn.departmentId.equals(entry.departmentId)) {
            const duration = (entry.timestamp.getTime() - lastIn.timestamp.getTime()) / (1000 * 60 * 60); // hours
            const key = entry.departmentId.toHexString();
            if (!workLogMap[key]) workLogMap[key] = { totalHours: 0, departmentId: key };
            workLogMap[key].totalHours += duration;
            lastIn = null;
        }
    }

    // Update workLogs
    wallet.workLogs = Object.values(workLogMap).map((v) => ({
        date: new Date(), // can refine to daily logs if needed
        departmentId: new mongoose.Types.ObjectId(v.departmentId),
        totalHours: v.totalHours,
        salaryEarned: v.totalHours * hourlyRate,
    }));

    await wallet.save();
    return wallet;
}
