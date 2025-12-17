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
   Serialize Employee (FIXED)
---------------------------------------------------- */
function serializeEmployee(emp: any) {
  return {
    ...emp,
    joinedDate: emp.joinedDate?.toISOString(), // ✅ IMPORTANT
    createdAt: emp.createdAt?.toISOString(),
    updatedAt: emp.updatedAt?.toISOString(),
    dob: emp.dob ? emp.dob.toISOString() : null,
  };
}

/* ----------------------------------------------------
   CREATE EMPLOYEE (JOINED DATE FIXED)
---------------------------------------------------- */
export async function createEmployee(
  data: any
): Promise<ActionResponse<any>> {
  try {
    /* ---------- NAME ---------- */
    if (!data.name || data.name.trim().length < 3) {
      return { success: false, message: "⚠️ Name must be at least 3 characters" };
    }

    /* ---------- JOINED DATE (NEW & REQUIRED) ---------- */
    if (!data.joinedDate) {
      return {
        success: false,
        message: "⚠️ Joining date is required",
      };
    }

    const joinedDate = new Date(data.joinedDate);
    if (isNaN(joinedDate.getTime())) {
      return {
        success: false,
        message: "⚠️ Invalid joining date",
      };
    }

    /* ---------- AADHAAR ---------- */
    if (!/^\d{12}$/.test(String(data.aadhaarNumber))) {
      return { success: false, message: "⚠️ Aadhaar must be 12 digits" };
    }

    const aadhaarExists = await prisma.employee.findUnique({
      where: { aadhaarNumber: String(data.aadhaarNumber) },
    });
    if (aadhaarExists) {
      return { success: false, message: "⚠️ Aadhaar already exists" };
    }

    /* ---------- MOBILE ---------- */
    if (!/^\d{10}$/.test(String(data.mobile))) {
      return { success: false, message: "⚠️ Mobile must be 10 digits" };
    }

    /* ---------- PF ---------- */
    if (data.pfId) {
      const pfExists = await prisma.employee.findUnique({
        where: { pfId: data.pfId },
      });
      if (pfExists) {
        return { success: false, message: "⚠️ PF ID already exists" };
      }
    }

    /* ---------- ESIC ---------- */
    if (data.esicId) {
      const esicExists = await prisma.employee.findUnique({
        where: { esicId: data.esicId },
      });
      if (esicExists) {
        return { success: false, message: "⚠️ ESIC ID already exists" };
      }
    }

    /* ---------- PAN ---------- */
    if (data.panNumber) {
      const panExists = await prisma.employee.findUnique({
        where: { panNumber: data.panNumber },
      });
      if (panExists) {
        return { success: false, message: "⚠️ PAN already exists" };
      }
    }

    /* ---------- DEPARTMENT ---------- */
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!department) {
      return { success: false, message: "⚠️ Invalid department" };
    }

    /* ---------- CYCLE ---------- */
    if (data.cycleTimingId) {
      const cycle = await prisma.cycleTiming.findUnique({
        where: { id: data.cycleTimingId },
      });
      if (!cycle) {
        return { success: false, message: "⚠️ Invalid cycle timing" };
      }
    }

    /* ---------- HOURLY RATE ---------- */
    if (!data.hourlyRate || Number(data.hourlyRate) <= 0) {
      return { success: false, message: "⚠️ Hourly rate must be > 0" };
    }

    /* ---------- EMP CODE ---------- */
    const empCode = await generateUniqueEmpCode();

    /* ---------- CREATE EMPLOYEE ---------- */
    const employee = await prisma.employee.create({
      data: {
        empCode,
        name: data.name,

        joinedDate, // ✅ USED EVERYWHERE NOW

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
      message: "🎉 Employee created successfully",
      data: serializeEmployee(employee),
    };
  } catch (error: any) {
    console.error("❌ Create Employee Error:", error);
    return { success: false, message: error.message || "Failed to create employee" };
  }
}

/* ----------------------------------------------------
   UPDATE EMPLOYEE (JOINED DATE SAFE)
---------------------------------------------------- */
export async function updateEmployee(
  id: string,
  updates: any
): Promise<ActionResponse<any>> {
  try {
    if (updates.joinedDate) {
      updates.joinedDate = new Date(updates.joinedDate);
    }

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
    return {
      success: false,
      message: error.message || "Failed to update employee",
    };
  }
}
