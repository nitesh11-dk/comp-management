"use server";

import prisma from "@/lib/prisma";
import { calculateWorkLogs } from "./attendance";

/* ----------------------------------------
   UTIL: Cycle date range
----------------------------------------- */
function getCycleRange(
  year: number,
  month: number,
  startDay: number,
  lengthDays: number
) {
  const cycleEnd = new Date(year, month - 1, startDay - 1, 23, 59, 59);
  const cycleStart = new Date(cycleEnd);
  cycleStart.setDate(cycleEnd.getDate() - lengthDays + 1);
  cycleStart.setHours(0, 0, 0, 0);

  return { cycleStart, cycleEnd };
}

/* ----------------------------------------
   UTIL: Month range
----------------------------------------- */
function getMonthRange(year: number, month: number) {
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  return { monthStart, monthEnd };
}

/* ----------------------------------------
   UTIL: Sum deductions
----------------------------------------- */
function sumDeductions(deductions?: Record<string, number>) {
  if (!deductions) return 0;
  return Object.values(deductions).reduce(
    (sum, v) => sum + Number(v || 0),
    0
  );
}

/* =========================================================
   1️⃣ READ ONLY — STRICT FILTER
   (YEAR + MONTH + CYCLE + JOINED DATE)
========================================================= */
export async function getMonthlySummaries(input: {
  year: number;
  month: number;
  cycleTimingId: string;
  departmentId?: string;
}) {
  const { year, month, cycleTimingId, departmentId } = input;

  if (!year || !month || !cycleTimingId) {
    throw new Error("Year, Month and Cycle are required");
  }

  const cycle = await prisma.cycleTiming.findUnique({
    where: { id: cycleTimingId },
  });
  if (!cycle) throw new Error("Invalid cycle");

  const { cycleStart } = getCycleRange(
    year,
    month,
    cycle.startDay,
    cycle.lengthDays
  );

  const { monthEnd } = getMonthRange(year, month);

  // 🔥 EMPLOYEE BASE QUERY (FINAL + CORRECT)
  const employees = await prisma.employee.findMany({
    where: {
      cycleTimingId,
      departmentId: departmentId || undefined,

      // ✅ REAL BUSINESS FILTER
      joinedAt: {
        lte: monthEnd,
      },
    },
    include: {
      monthlySummaries: {
        where: { cycleStart },
        take: 1,
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return employees.map((emp) => ({
    employee: emp,
    summary: emp.monthlySummaries[0] || null,
  }));
}

/* =========================================================
   INTERNAL — CALCULATION (MANUAL ONLY)
========================================================= */
async function calculateOneEmployee({
  employeeId,
  cycleTimingId,
  year,
  month,
  deductions = {},
  advanceAmount = 0,
  pfRate = 0.12,
}: {
  employeeId: string;
  cycleTimingId: string;
  year: number;
  month: number;
  deductions?: Record<string, number>;
  advanceAmount?: number;
  pfRate?: number;
}) {
  if (!employeeId || !cycleTimingId || !year || !month) {
    throw new Error("Employee, Year, Month, Cycle required");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) throw new Error("Employee not found");

  const cycle = await prisma.cycleTiming.findUnique({
    where: { id: cycleTimingId },
  });
  if (!cycle) throw new Error("Cycle not found");

  const { cycleStart, cycleEnd } = getCycleRange(
    year,
    month,
    cycle.startDay,
    cycle.lengthDays
  );

  // 🛑 SAFETY CHECK (IMPORTANT)
  if (employee.joinedAt > cycleEnd) {
    throw new Error("Employee not joined in this cycle");
  }

  const wallet = await prisma.attendanceWallet.findUnique({
    where: { employeeId },
    include: {
      entries: {
        where: {
          timestamp: {
            gte: cycleStart,
            lte: cycleEnd,
          },
        },
        orderBy: { timestamp: "asc" },
      },
    },
  });

  if (!wallet) throw new Error("Attendance wallet not found");

  const workLogs = await calculateWorkLogs(
    wallet.entries as any,
    employee.hourlyRate
  );

  const daysPresent = workLogs.length;
  const daysAbsent = cycle.lengthDays - daysPresent;

  const totalHours = workLogs.reduce(
    (sum, d) => sum + d.totalHours,
    0
  );

  const overtimeHours = Math.max(0, totalHours - cycle.lengthDays * 8);

  const grossSalary =
    Math.round(totalHours * employee.hourlyRate * 100) / 100;

  const pfAmount =
    Math.round(grossSalary * pfRate * 100) / 100;

  const netSalary =
    grossSalary -
    pfAmount -
    advanceAmount -
    sumDeductions(deductions);

  return prisma.monthlyAttendanceSummary.upsert({
    where: {
      employeeId_cycleStart: {
        employeeId,
        cycleStart,
      },
    },
    update: {
      daysPresent,
      daysAbsent,
      totalHours,
      overtimeHours,
      hourlyRate: employee.hourlyRate,
      grossSalary,
      pfAmount,
      advanceAmount,
      deductions,
      netSalary,
    },
    create: {
      employeeId,
      cycleStart,
      cycleEnd,
      daysInCycle: cycle.lengthDays,
      daysPresent,
      daysAbsent,
      totalHours,
      overtimeHours,
      hourlyRate: employee.hourlyRate,
      grossSalary,
      pfAmount,
      advanceAmount,
      deductions,
      netSalary,
    },
  });
}

/* =========================================================
   BUTTON: SINGLE EMPLOYEE
========================================================= */
export async function calculateMonthlyForEmployee(input: {
  employeeId: string;
  cycleTimingId: string;
  year: number;
  month: number;
}) {
  return {
    success: true,
    data: await calculateOneEmployee(input),
  };
}

/* =========================================================
   BUTTON: ALL EMPLOYEES (STRICT)
========================================================= */
export async function calculateMonthlyForAllEmployees(input: {
  cycleTimingId: string;
  year: number;
  month: number;
  departmentId?: string;
}) {
  const { cycleTimingId, year, month, departmentId } = input;

  if (!cycleTimingId || !year || !month) {
    throw new Error("Year, Month and Cycle required");
  }

  const employees = await prisma.employee.findMany({
    where: {
      cycleTimingId,
      departmentId: departmentId || undefined,
      joinedAt: {
        lte: new Date(year, month, 0, 23, 59, 59),
      },
    },
    select: { id: true },
  });

  for (const emp of employees) {
    await calculateOneEmployee({
      employeeId: emp.id,
      cycleTimingId,
      year,
      month,
    });
  }

  return {
    success: true,
    message: "Monthly calculation completed",
  };
}
