"use server";

import prisma from "@/lib/prisma";
import { ActionResponse } from "@/lib/types/types";

// ----------------------------------------------------
//    Generate Unique Employee Code
// ----------------------------------------------------
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

// ----------------------------------------------------
//    Serialize Employee
// ----------------------------------------------------
function serializeEmployee(emp: any) {
    return {
        ...emp,
        createdAt: emp.createdAt?.toISOString(),
        updatedAt: emp.updatedAt?.toISOString(),
        dob: emp.dob ? emp.dob.toISOString() : null,
    };
}

// ----------------------------------------------------
//    CREATE EMPLOYEE
// ----------------------------------------------------
export async function createEmployee(
    data: any
): Promise<ActionResponse<any>> {
    try {
        // -------------------- VALIDATE NAME --------------------
        if (!data.name || data.name.trim().length < 3) {
            return {
                success: false,
                message: "⚠️ Name must be at least 3 characters",
            };
        }

        // -------------------- VALIDATE AADHAAR --------------------
        if (!/^\d{12}$/.test(String(data.aadhaarNumber))) {
            return {
                success: false,
                message: "⚠️ Aadhaar must be a 12-digit number",
            };
        }

        const aadhaarExists = await prisma.employee.findUnique({
            where: { aadhaarNumber: String(data.aadhaarNumber) },
        });
        if (aadhaarExists) {
            return {
                success: false,
                message: "⚠️ Aadhaar already exists",
            };
        }

        // -------------------- VALIDATE MOBILE --------------------
        if (!/^\d{10}$/.test(String(data.mobile))) {
            return {
                success: false,
                message: "⚠️ Mobile must be a 10-digit number",
            };
        }

        // -------------------- VALIDATE PF --------------------
        if (data.pfId) {
            const pfExists = await prisma.employee.findUnique({
                where: { pfId: data.pfId },
            });
            if (pfExists) {
                return {
                    success: false,
                    message: "⚠️ PF ID already exists",
                };
            }
        }

        // -------------------- VALIDATE ESIC --------------------
        if (data.esicId) {
            const esicExists = await prisma.employee.findUnique({
                where: { esicId: data.esicId },
            });
            if (esicExists) {
                return {
                    success: false,
                    message: "⚠️ ESIC ID already exists",
                };
            }
        }

        // -------------------- VALIDATE PAN --------------------
        if (data.panNumber) {
            const panExists = await prisma.employee.findUnique({
                where: { panNumber: data.panNumber },
            });
            if (panExists) {
                return {
                    success: false,
                    message: "⚠️ PAN Number already exists",
                };
            }
        }

        // -------------------- VALIDATE SHIFT TYPE --------------------
        if (data.shiftTypeId) {
            const shift = await prisma.shiftType.findUnique({
                where: { id: data.shiftTypeId },
            });
            if (!shift) {
                return {
                    success: false,
                    message: "⚠️ Invalid shift type selected",
                };
            }
        }

        // -------------------- VALIDATE DEPARTMENT --------------------
        const department = await prisma.department.findUnique({
            where: { id: data.departmentId },
        });
        if (!department) {
            return {
                success: false,
                message: "⚠️ Invalid department selected",
            };
        }

        // -------------------- VALIDATE CYCLE TIMING --------------------
        if (data.cycleTimingId) {
            const cycle = await prisma.cycleTiming.findUnique({
                where: { id: data.cycleTimingId },
            });
            if (!cycle) {
                return {
                    success: false,
                    message: "⚠️ Invalid cycle timing selected",
                };
            }
        }

        // -------------------- VALIDATE HOURLY RATE --------------------
        if (!data.hourlyRate || Number(data.hourlyRate) <= 0) {
            return {
                success: false,
                message: "⚠️ Hourly rate must be greater than 0",
            };
        }

        // -------------------- GENERATE EMP CODE --------------------
        const empCode = await generateUniqueEmpCode();

        // -------------------- CREATE EMPLOYEE --------------------
        const employee = await prisma.employee.create({
            data: {
                empCode,
                name: data.name,

                aadhaarNumber: String(data.aadhaarNumber),
                mobile: String(data.mobile),

                pfId: data.pfId || null,
                pfActive: data.pfActive ?? true,

                esicId: data.esicId || null,
                esicActive: data.esicActive ?? true,

                panNumber: data.panNumber || null,
                dob: data.dob ? new Date(data.dob) : null,

                currentAddress: data.currentAddress || null,
                permanentAddress: data.permanentAddress || null,

                bankAccountNumber: data.bankAccountNumber || null,
                ifscCode: data.ifscCode || null,

                hourlyRate: Number(data.hourlyRate),

                departmentId: data.departmentId,
                shiftTypeId: data.shiftTypeId || null,
                cycleTimingId: data.cycleTimingId || null,

                profileComplete: true,
            },
        });

        // -------------------- CREATE ATTENDANCE WALLET --------------------
        await prisma.attendanceWallet.create({
            data: { employeeId: employee.id },
        });

        return {
            success: true,
            message: "🎉 Employee created successfully",
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

// ----------------------------------------------------
//    GET EMPLOYEES
// ----------------------------------------------------
export async function getEmployees(): Promise<ActionResponse<any[]>> {
    try {
        const employees = await prisma.employee.findMany({
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            data: employees.map(serializeEmployee),
            message: "Employees fetched successfully",
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || "Failed to fetch employees",
            data: [],
        };
    }
}

// ----------------------------------------------------
//    GET SINGLE EMPLOYEE
// ----------------------------------------------------
export async function getEmployeeById(id: string): Promise<ActionResponse<any>> {
    try {
        const employee = await prisma.employee.findUnique({ where: { id } });

        if (!employee) {
            return { success: false, message: "Employee not found" };
        }

        return {
            success: true,
            data: serializeEmployee(employee),
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || "Failed to fetch employee",
        };
    }
}

// ----------------------------------------------------
//    UPDATE EMPLOYEE
// ----------------------------------------------------
export async function updateEmployee(
    id: string,
    updates: any
): Promise<ActionResponse<any>> {
    try {
        if (updates.aadhaarNumber)
            updates.aadhaarNumber = String(updates.aadhaarNumber);

        if (updates.mobile)
            updates.mobile = String(updates.mobile);

        if (updates.dob)
            updates.dob = new Date(updates.dob);

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
            return { success: false, message: "Employee not found" };
        }

        return {
            success: false,
            message: error.message || "Failed to update employee",
        };
    }
}

// ----------------------------------------------------
//    DELETE EMPLOYEE
// ----------------------------------------------------
export async function deleteEmployee(id: string): Promise<ActionResponse> {
    try {
        await prisma.employee.delete({ where: { id } });

        return {
            success: true,
            message: "Employee deleted successfully",
        };
    } catch (error: any) {
        if (error.code === "P2025") {
            return { success: false, message: "Employee not found" };
        }

        return {
            success: false,
            message: error.message || "Failed to delete employee",
        };
    }
}
