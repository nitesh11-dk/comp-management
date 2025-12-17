"use server";

import { createEmployee } from "@/actions/employeeActions";
import { getDepartments } from "@/actions/department";
import { getShiftTypes } from "@/actions/shiftType";
import { getCycleTimings } from "@/actions/cycleTimings";

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
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return (
    chars[randomBetween(0, 25)] +
    chars[randomBetween(0, 25)] +
    chars[randomBetween(0, 25)] +
    chars[randomBetween(0, 25)] +
    chars[randomBetween(0, 25)] +
    randomBetween(1000, 9999) +
    chars[randomBetween(0, 25)]
  );
}

// --------------------------------------------------
// CREATE FAKE EMPLOYEES (FINAL FIXED)
// --------------------------------------------------
export async function createFakeEmployees(count: number = 5) {
  try {
    // 1️⃣ Load master data via ACTIONS
    const deptRes = await getDepartments();
    if (!deptRes.success || !deptRes.data?.length) {
      throw new Error("❌ No departments found");
    }

    const shiftRes = await getShiftTypes();
    const cycleRes = await getCycleTimings();

    const department = deptRes.data[0];
    const shiftType = shiftRes.success ? shiftRes.data?.[0] : null;
    const cycleTiming = cycleRes.success ? cycleRes.data?.[0] : null;

    // 2️⃣ Create fake employees
    const created: any[] = [];

    for (let i = 0; i < count; i++) {
      const joinedDate = new Date(
        randomBetween(2023, 2025),
        randomBetween(0, 11),
        randomBetween(1, 28)
      );

      const payload = {
        name: `Demo Employee ${Date.now()}-${i}`,

        aadhaarNumber: randomAadhaar(),
        mobile: randomMobile(),

        departmentId: department.id,
        shiftTypeId: shiftType?.id ?? null,
        cycleTimingId: cycleTiming?.id ?? null,

        pfId: `PF${Date.now()}${i}`,
        esicId: `ESIC${Date.now()}${i}`,
        panNumber: randomPAN(),

        dob: "1996-06-15",
        currentAddress: "Demo Address, City",
        permanentAddress: "Demo Address, City",

        bankAccountNumber: `${randomBetween(1000000000, 9999999999)}`,
        ifscCode: "HDFC0001234",

        hourlyRate: randomBetween(80, 160),

        // ✅ FINAL FIX: ISO STRING (NOT Date object)
        joinedAt: joinedDate.toISOString(),
      };

      const res = await createEmployee(payload);

      if (!res?.success) {
        console.error("❌ Fake employee create failed:", res);
        continue;
      }

      created.push(res.data);
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
  } catch (err: any) {
    console.error("❌ createFakeEmployees error:", err);
    return {
      success: false,
      message: err.message ?? "Failed to create fake employees",
    };
  }
}
