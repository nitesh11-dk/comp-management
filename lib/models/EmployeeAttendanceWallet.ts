// lib/models/EmployeeAttendanceWallet.ts
import mongoose, { Schema, Document } from "mongoose"

export interface IAttendanceEntry {
    timestamp: Date
    scanType: "in" | "out"
    departmentId: mongoose.Types.ObjectId
    scannedBy: mongoose.Types.ObjectId
    autoClosed?: boolean
}

export interface IWorkLog {
    date: Date
    departmentId: mongoose.Types.ObjectId
    totalHours: number
    salaryEarned: number
}

export interface IAttendanceWallet extends Document {
    employeeId: mongoose.Types.ObjectId
    entries: IAttendanceEntry[]
    workLogs: IWorkLog[]
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
)

const WorkLogSchema = new Schema<IWorkLog>(
    {
        date: { type: Date, required: true },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
        totalHours: { type: Number, required: true, default: 0 },
        salaryEarned: { type: Number, required: true, default: 0 },
    },
    { _id: false }
)

const AttendanceWalletSchema = new Schema<IAttendanceWallet>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, unique: true },
        entries: [AttendanceEntrySchema],
        workLogs: [WorkLogSchema],
    },
    { timestamps: true }
)

// 🔹 Fix for Next.js hot reload / undefined mongoose.models
const AttendanceWallet =
    mongoose.models["AttendanceWallet"] ||
    mongoose.model<IAttendanceWallet>("AttendanceWallet", AttendanceWalletSchema)

export default AttendanceWallet
