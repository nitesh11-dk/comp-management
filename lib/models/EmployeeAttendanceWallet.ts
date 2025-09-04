// lib/models/EmployeeAttendanceWallet.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAttendanceEntry {
    timestamp: Date;
    scanType: "in" | "out";
    departmentId: mongoose.Types.ObjectId;
    scannedBy: mongoose.Types.ObjectId;
    autoClosed?: boolean;
}

export interface IWorkLog {
    date: Date;
    departmentId: mongoose.Types.ObjectId;
    totalHours: number;
    salaryEarned: number;
}

export interface IAttendanceWallet extends Document {
    employeeId: mongoose.Types.ObjectId;
    entries: IAttendanceEntry[];
    workLogs: IWorkLog[];
}

const AttendanceEntrySchema = new Schema<IAttendanceEntry>(
    {
        timestamp: { type: Date, default: Date.now },
        scanType: { type: String, enum: ["in", "out"], required: true },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
        scannedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        autoClosed: { type: Boolean, default: false },
    },
    { _id: false }
);

const WorkLogSchema = new Schema<IWorkLog>(
    {
        date: { type: Date, required: true },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
        totalHours: { type: Number, required: true, default: 0 },
        salaryEarned: { type: Number, required: true, default: 0 },
    },
    { _id: false }
);

const AttendanceWalletSchema = new Schema<IAttendanceWallet>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, unique: true },
        entries: [AttendanceEntrySchema],
        workLogs: [WorkLogSchema],
    },
    { timestamps: true }
);

/**
 * 🔹 Helper method to calculate workLogs from entries
 */
AttendanceWalletSchema.methods.calculateWorkLogs = function (hourlyRate: number) {
    const groupedByDate: Record<string, IAttendanceEntry[]> = {};

    this.entries.forEach((entry: IAttendanceEntry) => {
        const dateStr = entry.timestamp.toISOString().split("T")[0];
        if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
        groupedByDate[dateStr].push(entry);
    });

    const logs: IWorkLog[] = [];

    for (const date in groupedByDate) {
        const dayEntries = groupedByDate[date].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        let totalMs = 0;

        for (let i = 0; i < dayEntries.length; i += 2) {
            const inEntry = dayEntries[i];
            const outEntry = dayEntries[i + 1];
            if (inEntry && outEntry && inEntry.scanType === "in" && outEntry.scanType === "out") {
                totalMs += outEntry.timestamp.getTime() - inEntry.timestamp.getTime();
            }
        }

        const totalHours = totalMs / (1000 * 60 * 60);
        logs.push({
            date: new Date(date),
            departmentId: dayEntries[0].departmentId,
            totalHours,
            salaryEarned: totalHours * hourlyRate,
        });
    }

    this.workLogs = logs;
    return this;
};

// 🔹 Fix for Next.js hot reload / undefined mongoose.models
const AttendanceWallet =
    mongoose.models["AttendanceWallet"] ||
    mongoose.model<IAttendanceWallet>("AttendanceWallet", AttendanceWalletSchema);

export default AttendanceWallet;
