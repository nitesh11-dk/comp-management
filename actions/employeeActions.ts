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
    joinedDate: emp.joinedDate?.toISOString() ?? null,
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
    if (!data.name || data.name.trim().length < 3) {
      return { success: false, message: "Name must be at least 3 characters" };
    }

    if (!data.joinedDate) {
      return { success: false, message: "Joining date is required" };
    }

    const joinedDate = new Date(data.joinedDate);
    if (isNaN(joinedDate.getTime())) {
      return { success: false, message: "Invalid joining date" };
    }

    if (!/^\d{12}$/.test(String(data.aadhaarNumber))) {
      return { success: false, message: "Aadhaar must be 12 digits" };
    }

    if (!/^\d{10}$/.test(String(data.mobile))) {
      return { success: false, message: "Mobile must be 10 digits" };
    }

    const empCode = await generateUniqueEmpCode();

    const employee = await prisma.employee.create({
      data: {
        empCode,
        name: data.name,
        joinedDate,

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

    await prisma.attendanceWallet.create({
      data: { employeeId: employee.id },
    });

    return {
      success: true,
      message: "Employee created successfully",
      data: serializeEmployee(employee),
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message };
  }
}

/* ----------------------------------------------------
   GET EMPLOYEES ✅ (THIS FIXES YOUR ERROR)
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
export async function getEmployeeById(id: string): Promise<ActionResponse<any>> {
  try {
    const emp = await prisma.employee.findUnique({ where: { id } });
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
    if (updates.joinedDate)
      updates.joinedDate = new Date(updates.joinedDate);

    if (updates.dob)
      updates.dob = new Date(updates.dob);

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
    return { success: false, message: error.message };
  }
}

/* ----------------------------------------------------
   DELETE EMPLOYEE
---------------------------------------------------- */
export async function deleteEmployee(id: string): Promise<ActionResponse> {
  try {
    await prisma.employee.delete({ where: { id } });
    return { success: true, message: "Employee deleted" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
