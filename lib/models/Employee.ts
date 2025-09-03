import mongoose, { Schema, Document } from "mongoose";

export interface IEmployee extends Document {
    name: string;
    empCode: string;
    pfId?: string;
    esicId?: string;
    aadhaarNumber: string;
    mobile: string;
    departmentId: mongoose.Types.ObjectId;
    shiftType: string;
    barcodeId: string;
    hourlyRate: number;
    profileComplete: boolean;
}

const EmployeeSchema = new Schema<IEmployee>(
    {
        name: { type: String, required: true },
        empCode: { type: String, required: true, unique: true },
        pfId: { type: String },
        esicId: { type: String },
        aadhaarNumber: { type: String, required: true, unique: true },
        mobile: { type: String, required: true },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
        shiftType: { type: String, required: true },
        barcodeId: { type: String, required: true, unique: true },
        hourlyRate: { type: Number, required: true },
        profileComplete: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.models.Employee ||
    mongoose.model<IEmployee>("Employee", EmployeeSchema);
