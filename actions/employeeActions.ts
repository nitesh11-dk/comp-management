// actions/employeeActions.ts
"use server";

import connect from "@/lib/mongo";
import Employee, { IEmployee } from "@/lib/models/Employee";
import { ActionResponse } from "@/lib/types/types";
import mongoose from "mongoose";

// Helper to generate empCode
function generateEmpCode(): string {
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `EMP${randomNum}`;
}

// Helper to generate random alphabets
function generateRandomAlphabets(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function createEmployee(
    data: Partial<IEmployee>
): Promise<ActionResponse<IEmployee>> {
    try {
        await connect();

        let empCode: string;
        let barcodeId: string;

        // 🔹 Loop until unique empCode + barcodeId are generated
        let isUnique = false;
        while (!isUnique) {
            empCode = generateEmpCode();
            barcodeId = empCode + generateRandomAlphabets(6);

            const exists = await Employee.findOne({
                $or: [{ empCode }, { barcodeId }],
            });

            if (!exists) {
                isUnique = true;
            }
        }

        // 🔹 Check uniqueness of Aadhaar, PF, ESIC manually
        if (data.aadhaarNumber) {
            const aadhaarExists = await Employee.findOne({ aadhaarNumber: data.aadhaarNumber });
            if (aadhaarExists) {
                return {
                    success: false,
                    message: "⚠️ Aadhaar number already exists",
                };
            }
        }

        if (data.pfId) {
            const pfExists = await Employee.findOne({ pfId: data.pfId });
            if (pfExists) {
                return {
                    success: false,
                    message: "⚠️ PF ID already exists",
                };
            }
        }

        if (data.esicId) {
            const esicExists = await Employee.findOne({ esicId: data.esicId });
            if (esicExists) {
                return {
                    success: false,
                    message: "⚠️ ESIC ID already exists",
                };
            }
        }

        // 🔹 Finally create employee
        const employee = await Employee.create({
            ...data,
            empCode,
            barcodeId,
            hourlyRate: data.hourlyRate ?? 100, // default
            profileComplete: true,
        });

        return {
            success: true,
            message: "✅ Employee created successfully",
            data: employee,
        };
    } catch (error: any) {
        console.error("❌ Create Employee Error:", error);
        return {
            success: false,
            message: error.message || "Failed to create employee",
        };
    }
}

// 🔹 Get All Employees
export async function getEmployees(): Promise<ActionResponse<IEmployee[]>> {
    try {
        await connect();

        const employees = await Employee.find().populate("departmentId");

        return {
            success: true,
            message: "Employees fetched successfully",
            data: employees,
        };
    } catch (error: any) {
        console.error("❌ Get Employees Error:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch employees",
        };
    }
}

// 🔹 Get Single Employee
export async function getEmployeeById(id: string): Promise<ActionResponse<IEmployee>> {
    try {
        await connect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { success: false, message: "Invalid employee ID" };
        }

        const employee = await Employee.findById(id).populate("departmentId");
        if (!employee) {
            return { success: false, message: "Employee not found" };
        }

        return {
            success: true,
            message: "Employee fetched successfully",
            data: employee,
        };
    } catch (error: any) {
        console.error("❌ Get Employee Error:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch employee",
        };
    }
}

// 🔹 Update Employee
export async function updateEmployee(
    id: string,
    updates: Partial<IEmployee>
): Promise<ActionResponse<IEmployee>> {
    try {
        await connect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { success: false, message: "Invalid employee ID" };
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(id, updates, {
            new: true,
        });

        if (!updatedEmployee) {
            return { success: false, message: "Employee not found" };
        }

        return {
            success: true,
            message: "Employee updated successfully",
            data: updatedEmployee,
        };
    } catch (error: any) {
        console.error("❌ Update Employee Error:", error);
        return {
            success: false,
            message: error.message || "Failed to update employee",
        };
    }
}

// 🔹 Delete Employee
export async function deleteEmployee(id: string): Promise<ActionResponse> {
    try {
        await connect();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return { success: false, message: "Invalid employee ID" };
        }

        const deleted = await Employee.findByIdAndDelete(id);

        if (!deleted) {
            return { success: false, message: "Employee not found" };
        }

        return {
            success: true,
            message: "Employee deleted successfully",
        };
    } catch (error: any) {
        console.error("❌ Delete Employee Error:", error);
        return {
            success: false,
            message: error.message || "Failed to delete employee",
        };
    }
}
