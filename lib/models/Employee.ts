import mongoose, { Schema, Document } from "mongoose"
import Department from "@/lib/models/Department"

export interface IEmployee extends Document {
    empCode: string
    name: string
    pfId?: string
    esicId?: string
    aadhaarNumber: number   // 👈 number now
    mobile: number          // 👈 number now
    departmentId: mongoose.Types.ObjectId
    shiftType: string
    hourlyRate: number      // 👈 already number
    profileComplete: boolean
}

const EmployeeSchema = new Schema<IEmployee>(
    {
        empCode: {
            type: String,
            required: true,
            unique: true,
            match: /^[A-Z0-9]{8}$/ // 👈 updated for alphanumeric 8-char code
        },
        name: { type: String, required: true },
        pfId: { type: String, unique: true, sparse: true }, // optional
        esicId: { type: String, unique: true, sparse: true }, // optional

        // Aadhaar number must be numeric (12 digits usually)
        aadhaarNumber: {
            type: Number,
            required: true,
            unique: true,
            validate: {
                validator: (v: number) => /^\d{12}$/.test(v.toString()),
                message: "Aadhaar must be a 12-digit number"
            }
        },

        // Mobile number must be numeric (10 digits usually in India)
        mobile: {
            type: Number,
            required: true,
            validate: {
                validator: (v: number) => /^\d{10}$/.test(v.toString()),
                message: "Mobile number must be a 10-digit number"
            }
        },

        departmentId: { type: Schema.Types.ObjectId, ref: "Department", required: true },
        shiftType: { type: String, required: true },
        hourlyRate: { type: Number, required: true },
        profileComplete: { type: Boolean, default: false },
    },
    { timestamps: true }
)

// Export model safely
export default mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema)
