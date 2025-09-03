import mongoose, { Schema, Document } from "mongoose";

export interface IWorkLog extends Document {
    employeeId: mongoose.Types.ObjectId;
    date: Date;
    totalHours: number;
    salaryEarned: number;
}

const WorkLogSchema = new Schema<IWorkLog>(
    {
        employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
        date: { type: Date, required: true },
        totalHours: { type: Number, required: true, default: 0 },
        salaryEarned: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.models.WorkLog ||
    mongoose.model<IWorkLog>("WorkLog", WorkLogSchema);
