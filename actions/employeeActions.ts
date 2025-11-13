"use server";

import prisma from "@/lib/prisma";
import { ActionResponse } from "@/lib/types/types";

// Utility: Generate Unique Employee Code
async function generateUniqueEmpCode(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    while (true) {
        const code = Array.from({ length: 8 }, () =>
            chars.charAt(Math.floor(Math.random() * chars.length))
        ).join("");

        const exists = await prisma.employee.findUnique({
            where: { empCode: code },
        });

        if (!exists) return code;
    }
}

// Utility: Serialize Employee (because Prisma returns id in correct format)
function serializeEmployee(emp: any) {
    return {
        ...emp,
        createdAt: emp.createdAt?.toISOString(),
        updatedAt: emp.updatedAt?.toISOString(),
    };
}

//
// --------------------- CREATE EMPLOYEE ----------------------
//
export async function createEmployee(
    data: any
): Promise<ActionResponse<any>> {
    try {
        // Validate Aadhaar
        if (data.aadhaarNumber) {
            if (!/^\d{12}$/.test(data.aadhaarNumber.toString())) {
                return {
                    success: false,
                    message: "⚠️ Aadhaar number must be a 12-digit number",
                };
            }

            const exists = await prisma.employee.findUnique({
                where: { aadhaarNumber: data.aadhaarNumber.toString() },
            });

            if (exists)
                return {
                    success: false,
                    message: "⚠️ Aadhaar number already exists",
                };
        }

        // Validate PF
        if (data.pfId) {
            const exists = await prisma.employee.findUnique({
                where: { pfId: data.pfId },
            });
            if (exists)
                return {
                    success: false,
                    message: "⚠️ PF ID already exists",
                };
        }

        // Validate ESIC
        if (data.esicId) {
            const exists = await prisma.employee.findUnique({
                where: { esicId: data.esicId },
            });
            if (exists)
                return {
                    success: false,
                    message: "⚠️ ESIC ID already exists",
                };
        }

        // Validate mobile
        if (data.mobile) {
            if (!/^\d{10}$/.test(data.mobile.toString())) {
                return {
                    success: false,
                    message: "⚠️ Mobile number must be a 10-digit number",
                };
            }
        }

        // Generate empCode
        const empCode = await generateUniqueEmpCode();

        // Convert numeric fields to string (important)
        const employee = await prisma.employee.create({
            data: {
                empCode,
                name: data.name,
                pfId: data.pfId || null,
                esicId: data.esicId || null,
                aadhaarNumber: data.aadhaarNumber.toString(),
                mobile: data.mobile.toString(),
                shiftType: data.shiftType,
                hourlyRate: Number(data.hourlyRate ?? 100),
                profileComplete: true,
                departmentId: data.departmentId,
            },
        });

        return {
            success: true,
            message: "✅ Employee created successfully",
            data: serializeEmployee(employee),
        };
    } catch (error: any) {
        console.error("❌ Create Employee Error:", error);
        return {
            success: false,
            message: error.message || "Failed to create employee",
        };
    }
}

//
// --------------------- GET ALL EMPLOYEES ----------------------
//
export async function getEmployees(): Promise<ActionResponse<any[]>> {
    try {
        const employees = await prisma.employee.findMany({
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            message: "Employees fetched successfully",
            data: employees.map(serializeEmployee),
        };
    } catch (error: any) {
        console.error("❌ Get Employees Error:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch employees",
            data: [],
        };
    }
}

//
// --------------------- GET SINGLE EMPLOYEE ----------------------
//
export async function getEmployeeById(
    id: string
): Promise<ActionResponse<any>> {
    try {
        const employee = await prisma.employee.findUnique({
            where: { id },
        });

        if (!employee)
            return { success: false, message: "Employee not found" };

        return {
            success: true,
            message: "Employee fetched successfully",
            data: serializeEmployee(employee),
        };
    } catch (error: any) {
        console.error("❌ Get Employee Error:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch employee",
        };
    }
}

//
// --------------------- UPDATE EMPLOYEE ----------------------
//
export async function updateEmployee(
    id: string,
    updates: any
): Promise<ActionResponse<any>> {
    try {
        // Convert numeric fields to string where needed
        if (updates.aadhaarNumber)
            updates.aadhaarNumber = updates.aadhaarNumber.toString();

        if (updates.mobile) updates.mobile = updates.mobile.toString();

        const employee = await prisma.employee.update({
            where: { id },
            data: updates,
        });

        return {
            success: true,
            message: "Employee updated successfully",
            data: serializeEmployee(employee),
        };
    } catch (error: any) {
        if (error.code === "P2025") {
            return {
                success: false,
                message: "Employee not found",
            };
        }

        console.error("❌ Update Employee Error:", error);
        return {
            success: false,
            message: error.message || "Failed to update employee",
        };
    }
}

//
// --------------------- DELETE EMPLOYEE ----------------------
//
export async function deleteEmployee(
    id: string
): Promise<ActionResponse> {
    try {
        await prisma.employee.delete({
            where: { id },
        });

        return {
            success: true,
            message: "Employee deleted successfully",
        };
    } catch (error: any) {
        if (error.code === "P2025") {
            return {
                success: false,
                message: "Employee not found",
            };
        }

        console.error("❌ Delete Employee Error:", error);
        return {
            success: false,
            message: error.message || "Failed to delete employee",
        };
    }
}
