// actions/employeeActions.ts
"use server";

import connect from "@/lib/mongo";
import Employee, { IEmployee } from "@/lib/models/Employee";
import { ActionResponse } from "@/lib/types/types";
import mongoose from "mongoose";
import Department from "@/lib/models/Department";

function serializeEmployee(emp: any): IEmployee {
    return {
        ...emp,
        _id: emp._id.toString(),
        departmentId: emp.departmentId?.toString(),
        createdAt: emp.createdAt?.toISOString(),
        updatedAt: emp.updatedAt?.toISOString(),
    };
}

// 🔹 Create Employee
export async function createEmployee(
    data: Partial<IEmployee>
): Promise<ActionResponse<IEmployee>> {
    try {
        await connect();

        // Validate Aadhaar number
        if (data.aadhaarNumber) {
            if (!/^\d{12}$/.test(data.aadhaarNumber.toString())) {
                return { success: false, message: "⚠️ Aadhaar number must be a 12-digit number" };
            }
            const aadhaarExists = await Employee.findOne({ aadhaarNumber: data.aadhaarNumber });
            if (aadhaarExists) return { success: false, message: "⚠️ Aadhaar number already exists" };
        }

        // Validate PF ID uniqueness
        if (data.pfId) {
            const pfExists = await Employee.findOne({ pfId: data.pfId });
            if (pfExists) return { success: false, message: "⚠️ PF ID already exists" };
        }

        // Validate ESIC ID uniqueness
        if (data.esicId) {
            const esicExists = await Employee.findOne({ esicId: data.esicId });
            if (esicExists) return { success: false, message: "⚠️ ESIC ID already exists" };
        }

        // Validate Mobile number
        if (data.mobile) {
            if (!/^\d{10}$/.test(data.mobile.toString())) {
                return { success: false, message: "⚠️ Mobile number must be a 10-digit number" };
            }
        }

        // Generate unique empCode
        async function generateUniqueEmpCode(): Promise<string> {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let code = "";
            let exists = true;

            while (exists) {
                code = Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
                const existing = await Employee.findOne({ empCode: code });
                exists = !!existing;
            }

            return code;
        }

        const empCode = await generateUniqueEmpCode();

        // Create employee
        const employee = await Employee.create({
            ...data,
            empCode,
            hourlyRate: data.hourlyRate ?? 100,
            profileComplete: true,
        });

        return {
            success: true,
            message: "✅ Employee created successfully",
            data: serializeEmployee(employee),
        };
    } catch (error: any) {
        console.error("❌ Create Employee Error:", error);
        return { success: false, message: error.message || "Failed to create employee" };
    }
}

// 🔹 Get All Employees
export async function getEmployees(): Promise<ActionResponse<IEmployee[]>> {
    try {
        await connect();
        const employees = await Employee.find().lean();
        const serialized = employees.map(serializeEmployee);

        return { success: true, message: "Employees fetched successfully", data: serialized };
    } catch (error: any) {
        console.error("❌ Get Employees Error:", error);
        return { success: false, message: error.message || "Failed to fetch employees" };
    }
}

// 🔹 Get Single Employee
export async function getEmployeeById(id: string): Promise<ActionResponse<IEmployee>> {
    try {
        await connect();

        if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, message: "Invalid employee ID" };

        const employee = await Employee.findById(id).lean();
        if (!employee) return { success: false, message: "Employee not found" };

        return { success: true, message: "Employee fetched successfully", data: serializeEmployee(employee) };
    } catch (error: any) {
        console.error("❌ Get Employee Error:", error);
        return { success: false, message: error.message || "Failed to fetch employee" };
    }
}

// 🔹 Update Employee
export async function updateEmployee(id: string, updates: Partial<IEmployee>): Promise<ActionResponse<IEmployee>> {
    try {
        await connect();

        if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, message: "Invalid employee ID" };

        const updatedEmployee = await Employee.findByIdAndUpdate(id, updates, { new: true }).lean();
        if (!updatedEmployee) return { success: false, message: "Employee not found" };

        return { success: true, message: "Employee updated successfully", data: serializeEmployee(updatedEmployee) };
    } catch (error: any) {
        console.error("❌ Update Employee Error:", error);
        return { success: false, message: error.message || "Failed to update employee" };
    }
}

// 🔹 Delete Employee
export async function deleteEmployee(id: string): Promise<ActionResponse> {
    try {
        await connect();

        if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, message: "Invalid employee ID" };

        const deleted = await Employee.findByIdAndDelete(id).lean();
        if (!deleted) return { success: false, message: "Employee not found" };

        return { success: true, message: "Employee deleted successfully" };
    } catch (error: any) {
        console.error("❌ Delete Employee Error:", error);
        return { success: false, message: error.message || "Failed to delete employee" };
    }
}
