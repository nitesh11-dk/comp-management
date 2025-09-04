"use server";

import AttendanceWallet, { IAttendanceWallet } from "@/lib/models/EmployeeAttendanceWallet";
import Employee from "@/lib/models/Employee";
import Department from "@/lib/models/Department";
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

    // 🔹 Fetch all AttendanceWallets that have entries scanned by this supervisor
    const wallets: IAttendanceWallet[] = await AttendanceWallet.find({
        "entries.scannedBy": new mongoose.Types.ObjectId(supervisor.id),
    })
        .populate({
            path: "employeeId",
            select: "name",
            model: Employee,
        })
        .populate({
            path: "entries.departmentId",
            select: "name",
            model: Department,
        })
        .exec();

    // 🔹 Flatten entries for this supervisor
    const logs: SupervisorScanLog[] = [];

    wallets.forEach((wallet) => {
        wallet.entries.forEach((entry) => {
            if (entry.scannedBy.toString() === supervisor.id) {
                logs.push({
                    employeeId: wallet.employeeId._id.toString(),
                    employeeName: (wallet.employeeId as any).name || "Unknown",
                    departmentId: (entry.departmentId as any)?._id?.toString() || "",
                    departmentName: (entry.departmentId as any)?.name || "Unknown",
                    scanType: entry.scanType,
                    timestamp: entry.timestamp,
                    autoClosed: entry.autoClosed,
                });
            }
        });
    });

    // 🔹 Sort logs by timestamp descending (latest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return logs;
}
