"use server";

import AttendanceWallet, { IAttendanceWallet } from "@/lib/models/EmployeeAttendanceWallet";
import Employee, { IEmployee } from "@/lib/models/Employee";
import Department, { IDepartment } from "@/lib/models/Department";
import { getUserFromCookies } from "@/lib/auth";
import mongoose from "mongoose";

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
    // 🔹 Get current logged-in supervisor
    const supervisor = await getUserFromCookies();
    if (!supervisor) throw new Error("Unauthorized");

    const supervisorId = new mongoose.Types.ObjectId(supervisor.id);

    // 🔹 Fetch all AttendanceWallets with entries scanned by this supervisor
    const wallets: IAttendanceWallet[] = await AttendanceWallet.find({
        "entries.scannedBy": supervisorId,
    })
        .populate<{ employeeId: IEmployee }>("employeeId", "name")
        .populate<{ "entries.departmentId": IDepartment }>("entries.departmentId", "name")
        .exec();

    const logs: SupervisorScanLog[] = [];

    // 🔹 Flatten entries scanned by this supervisor
    wallets.forEach((wallet) => {
        const employee = wallet.employeeId as IEmployee;
        wallet.entries.forEach((entry) => {
            if (entry.scannedBy.toString() !== supervisor.id) return;

            const department = entry.departmentId as IDepartment | null;

            logs.push({
                employeeId: employee?._id.toString() || "",
                employeeName: employee?.name || "Unknown",
                departmentId: department?._id?.toString() || "",
                departmentName: department?.name || "Unknown",
                scanType: entry.scanType,
                timestamp: entry.timestamp,
                autoClosed: entry.autoClosed,
            });
        });
    });

    // 🔹 Sort logs by timestamp descending (latest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return logs;
}
