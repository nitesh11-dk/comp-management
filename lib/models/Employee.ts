import mongoose, { Schema, Document } from "mongoose"
import Department from "@/lib/models/Department"

export interface IEmployee extends Document {
    name: string
    pfId?: string
    esicId?: string
    aadhaarNumber: string
    mobile: string
    departmentId: mongoose.Types.ObjectId
    shiftType: string
    hourlyRate: number
    profileComplete: boolean
}

const EmployeeSchema = new Schema<IEmployee>(
    {
        name: { type: String, required: true },
        pfId: { type: String, unique: true, sparse: true }, // optional
        esicId: { type: String, unique: true, sparse: true }, // optional
        aadhaarNumber: { type: String, required: true, unique: true },
        mobile: { type: String, required: true },
        departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
        shiftType: { type: String, required: true },
        hourlyRate: { type: Number, required: true },
        profileComplete: { type: Boolean, default: false },
    },
    { timestamps: true }
)

// Export model safely
export default mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema)
