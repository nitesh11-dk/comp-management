"use server";

import prisma from "@/lib/prisma";
import { createEmployee } from "@/actions/employeeActions";

// --------------------------------------------------
// utils
// --------------------------------------------------
function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAadhaar() {
  return `${randomBetween(100000000000, 999999999999)}`;
}

function randomMobile() {
  return `9${randomBetween(100000000, 999999999)}`;
}

function randomPAN() {
  return `ABCDE${randomBetween(1000, 9999)}F`;
}

// --------------------------------------------------
// CREATE FAKE EMPLOYEES (SAFE)
// --------------------------------------------------
export async function createFakeEmployees(count: number = 12) {
  // ----------------------------------------------
  // 1️⃣ Load master data
  // ----------------------------------------------
  const department = await prisma.department.findFirst();
  if (!department) throw new Error("❌ No department exists");

  const shiftType = await prisma.shiftType.findFirst();
  const cycleTiming = await prisma.cycleTiming.findFirst();

  // ----------------------------------------------
  // 2️⃣ Create employees via existing action
  // ----------------------------------------------
  const created: any[] = [];

  for (let i = 0; i < count; i++) {
    const payload = {
      name: `Demo Employee ${Date.now()}-${i}`,

      aadhaarNumber: randomAadhaar(),
      mobile: randomMobile(),

      departmentId: department.id,
      shiftTypeId: shiftType?.id ?? null,
      cycleTimingId: cycleTiming?.id ?? null,

      pfId: `PF${randomBetween(10000, 99999)}`,
      esicId: `ESIC${randomBetween(10000, 99999)}`,
      panNumber: randomPAN(),

      dob: "1996-06-15",
      currentAddress: "Demo Address, City",
      permanentAddress: "Demo Address, City",

      bankAccountNumber: `${randomBetween(1000000000, 9999999999)}`,
      ifscCode: "HDFC0001234",

      hourlyRate: randomBetween(80, 160),
    };

    // ✅ SINGLE SOURCE OF TRUTH
    const res = await createEmployee(payload);

    if (res.success) {
      created.push(res.data);
    }
  }

  return {
    success: true,
    message: `✅ ${created.length} fake employees created`,
    employees: created.map((e) => ({
      id: e.id,
      empCode: e.empCode,
      name: e.name,
    })),
  };
}
