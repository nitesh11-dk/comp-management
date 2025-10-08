import mongoose, { Schema, Document, models, model } from "mongoose";

// 🔹 Attendance Entry interface
export interface IAttendanceEntry {
    timestamp: Date;
    scanType: "in" | "out";
    departmentId: mongoose.Types.ObjectId;
    scannedBy: mongoose.Types.ObjectId;
    autoClosed?: boolean;
}

// 🔹 Attendance Wallet interface
export interface IAttendanceWallet extends Document {
    employeeId: mongoose.Types.ObjectId;
    entries: IAttendanceEntry[];
}

// 🔹 Schemas
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

const AttendanceWalletSchema = new Schema<IAttendanceWallet>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, unique: true },
        entries: [AttendanceEntrySchema],
    },
    { timestamps: true }
);

// 🔹 Export the model safely
const AttendanceWalletModel = models.AttendanceWallet || model<IAttendanceWallet>("AttendanceWallet", AttendanceWalletSchema);

export default AttendanceWalletModel;
