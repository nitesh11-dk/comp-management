import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
    employeeId: mongoose.Types.ObjectId;
    scanType: "in" | "out";
    scannedBy: mongoose.Types.ObjectId;
    timestamp: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
        scanType: { type: String, enum: ["in", "out"], required: true },
        scannedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.models.Attendance ||
    mongoose.model<IAttendance>("Attendance", AttendanceSchema);
