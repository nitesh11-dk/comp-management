import mongoose, { Schema, Document } from "mongoose";

export interface IDepartment extends Document {
    name: string;
    description?: string;
}

const DepartmentSchema = new Schema<IDepartment>(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.Department ||
    mongoose.model<IDepartment>("Department", DepartmentSchema);
