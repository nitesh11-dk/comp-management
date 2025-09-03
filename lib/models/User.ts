import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    username: string;
    password: string;
    role: "admin" | "supervisor";
    departmentId?: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true, // ✅ always stored in lowercase
            trim: true,
            match: [/^[a-z0-9]+$/, "Username can only contain lowercase letters and numbers"], // ✅ regex validation
        },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["admin", "supervisor"],
            required: true,
        },
        departmentId: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            required: function () {
                return this.role === "supervisor";
            },
        },
    },
    { timestamps: true }
);

export default mongoose.models.User ||
    mongoose.model<IUser>("User", UserSchema);
