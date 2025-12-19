"use server";

import prisma from "@/lib/prisma";
import { ActionResponse } from "@/lib/types/types";

/* ----------------------------------------------------
   Generate Unique Employee Code
---------------------------------------------------- */
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

/* ----------------------------------------------------
   Serialize Employee
---------------------------------------------------- */
function serializeEmployee(emp: any) {
  return {
    ...emp,
    joinedAt: emp.joinedAt?.toISOString() ?? null,
    createdAt: emp.createdAt?.toISOString(),
    updatedAt: emp.updatedAt?.toISOString(),
    dob: emp.dob ? emp.dob.toISOString() : null,
  };
}

/* ----------------------------------------------------
   CREATE EMPLOYEE
---------------------------------------------------- */
export async function createEmployee(
  data: any
): Promise<ActionResponse<any>> {
  try {
    /* ---------- VALIDATIONS ---------- */

    if (!data.name || data.name.trim().length < 3) {
      return { success: false, message: "Name must be at least 3 characters" };
    }

    if (!data.joinedAt) {
      return { success: false, message: "Joining date is required" };
    }

    const joinedAt = new Date(data.joinedAt);
    if (isNaN(joinedAt.getTime())) {
      return { success: false, message: "Invalid joining date" };
    }

    if (!/^\d{12}$/.test(String(data.aadhaarNumber))) {
      return { success: false, message: "Aadhaar must be 12 digits" };
    }

    if (!/^\d{10}$/.test(String(data.mobile))) {
      return { success: false, message: "Mobile must be 10 digits" };
    }

    // ✅ PF Amount Per Day validation
    if (
      data.pfAmountPerDay !== undefined &&
      (isNaN(Number(data.pfAmountPerDay)) || Number(data.pfAmountPerDay) < 0)
    ) {
      return {
        success: false,
        message: "PF amount per day must be a valid non-negative number",
      };
    }

    const empCode = await generateUniqueEmpCode();

    /* ---------- CREATE ---------- */

    const employee = await prisma.employee.create({
      data: {
        empCode,
        name: data.name,
        joinedAt,

        aadhaarNumber: String(data.aadhaarNumber),
        mobile: String(data.mobile),

        pfId: data.pfId || null,
        pfActive: data.pfActive ?? true,
        pfAmountPerDay:
          data.pfAmountPerDay !== undefined
            ? Number(data.pfAmountPerDay)
            : 0,

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

    await prisma.attendanceWallet.create({
      data: { employeeId: employee.id },
    });

    return {
      success: true,
      message: "Employee created successfully",
      data: serializeEmployee(employee),
    };
  } catch (error: any) {
    console.error("❌ Create Employee Error:", error);

    // Handle unique constraint violations
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      switch (field) {
        case "aadhaarNumber":
          return {
            success: false,
            message: "Aadhaar number already exists. Please use a different Aadhaar number.",
          };
        case "pfId":
          return {
            success: false,
            message: "PF ID already exists. Please use a different PF ID.",
          };
        case "esicId":
          return {
            success: false,
            message: "ESIC ID already exists. Please use a different ESIC ID.",
          };
        case "panNumber":
          return {
            success: false,
            message: "PAN number already exists. Please use a different PAN number.",
          };
        case "empCode":
          return {
            success: false,
            message: "Employee code generation failed. Please try again.",
          };
        default:
          return {
            success: false,
            message: "A unique constraint was violated. Please check your input.",
          };
      }
    }

    return { success: false, message: error.message || "Failed to create employee" };
  }
}

/* ----------------------------------------------------
   GET EMPLOYEES
---------------------------------------------------- */
export async function getEmployees(): Promise<ActionResponse<any[]>> {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: employees.map(serializeEmployee),
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      data: [],
    };
  }
}

/* ----------------------------------------------------
   GET SINGLE EMPLOYEE
---------------------------------------------------- */
export async function getEmployeeById(
  id: string
): Promise<ActionResponse<any>> {
  try {
    const emp = await prisma.employee.findUnique({ where: { id },include: {
    department: true,
    shiftType: true,
    cycleTiming: true,
  }, });
    if (!emp) return { success: false, message: "Employee not found" };

    return { success: true, data: serializeEmployee(emp) };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/* ----------------------------------------------------
   UPDATE EMPLOYEE
---------------------------------------------------- */
export async function updateEmployee(
  id: string,
  updates: any
): Promise<ActionResponse<any>> {
  try {
    if (updates.joinedAt) updates.joinedAt = new Date(updates.joinedAt);
    if (updates.dob) updates.dob = new Date(updates.dob);

    // ✅ PF Amount validation during update
    if (
      updates.pfAmountPerDay !== undefined &&
      (isNaN(Number(updates.pfAmountPerDay)) ||
        Number(updates.pfAmountPerDay) < 0)
    ) {
      return {
        success: false,
        message: "PF amount per day must be a valid non-negative number",
      };
    }

    if (updates.pfAmountPerDay !== undefined) {
      updates.pfAmountPerDay = Number(updates.pfAmountPerDay);
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updates,
    });

    return {
      success: true,
      message: "Employee updated",
      data: serializeEmployee(employee),
    };
  } catch (error: any) {
    console.error("❌ Update Employee Error:", error);

    // Handle unique constraint violations
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      switch (field) {
        case "aadhaarNumber":
          return {
            success: false,
            message: "Aadhaar number already exists for another employee. Please use a different Aadhaar number.",
          };
        case "pfId":
          return {
            success: false,
            message: "PF ID already exists for another employee. Please use a different PF ID.",
          };
        case "esicId":
          return {
            success: false,
            message: "ESIC ID already exists for another employee. Please use a different ESIC ID.",
          };
        case "panNumber":
          return {
            success: false,
            message: "PAN number already exists for another employee. Please use a different PAN number.",
          };
        default:
          return {
            success: false,
            message: "A unique constraint was violated. Please check your input.",
          };
      }
    }

    return { success: false, message: error.message || "Failed to update employee" };
  }
}

/* ----------------------------------------------------
   DELETE EMPLOYEE
---------------------------------------------------- */
export async function deleteEmployee(
  id: string
): Promise<ActionResponse> {
  try {
    
    await prisma.employee.delete({ where: { id } });
    return { success: true, message: "Employee and all related data deleted successfully" };
  } catch (error: any) {
    console.error("❌ Delete Employee Error:", error);
    return { success: false, message: error.message || "Failed to delete employee" };
  }
}
