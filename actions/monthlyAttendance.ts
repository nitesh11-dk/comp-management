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
   UTIL: Effective cycle end
----------------------------------------- */
function getEffectiveCycleEnd(
  cycleEnd: Date,
  year: number,
  month: number
) {
  const today = new Date();
  const { monthEnd } = getMonthRange(year, month);

  return new Date(
    Math.min(
      cycleEnd.getTime(),
      today.getTime(),
      monthEnd.getTime()
    )
  );
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

  const employees = await prisma.employee.findMany({
    where: {
      cycleTimingId,
      departmentId: departmentId || undefined,
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
   INTERNAL — CALCULATION (CYCLE-AWARE)
========================================================= */
async function calculateOneEmployee({
  employeeId,
  cycleTimingId,
  year,
  month,
}: {
  employeeId: string;
  cycleTimingId: string;
  year: number;
  month: number;
}) {
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

  // ❌ Not eligible for this cycle
  if (employee.joinedAt > cycleEnd) {
    return null;
  }

  // ✅ Effective end (IMPORTANT)
  const effectiveCycleEnd = getEffectiveCycleEnd(
    cycleEnd,
    year,
    month
  );

  // 🔍 Existing summary (manual values preserve)
  const existingSummary =
    await prisma.monthlyAttendanceSummary.findUnique({
      where: {
        employeeId_cycleStart: {
          employeeId,
          cycleStart,
        },
      },
    });

  const wallet = await prisma.attendanceWallet.findUnique({
    where: { employeeId },
    include: {
      entries: {
        where: {
          timestamp: {
            gte: cycleStart,
            lte: effectiveCycleEnd,
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

  const daysInCycle =
    Math.floor(
      (effectiveCycleEnd.getTime() - cycleStart.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  const daysAbsent = Math.max(0, daysInCycle - daysPresent);

  const totalHours = workLogs.reduce(
    (sum, d) => sum + d.totalHours,
    0
  );

  // 🔒 Manual values
  const overtimeHours = existingSummary?.overtimeHours ?? 0;
  const advanceAmount = existingSummary?.advanceAmount ?? 0;
  const deductions = (existingSummary?.deductions as any) ?? {
    shoes: 0,
    canteen: 0,
  };

  // PF Deduction
  const pfDeduction = employee.pfActive && employee.pfAmountPerDay ? (employee.pfAmountPerDay * daysPresent) : 0;

  const netSalary =
    Math.round(
      (totalHours + overtimeHours) * employee.hourlyRate * 100
    ) /
      100 -
    advanceAmount -
    sumDeductions(deductions) -
    pfDeduction;

  return prisma.monthlyAttendanceSummary.upsert({
    where: {
      employeeId_cycleStart: {
        employeeId,
        cycleStart,
      },
    },
    update: {
      daysInCycle,
      daysPresent,
      daysAbsent,
      totalHours,
      hourlyRate: employee.hourlyRate,
      netSalary,
      overtimeHours,
      advanceAmount,
      deductions,
    },
    create: {
      employeeId,
      cycleStart,
      cycleEnd,
      daysInCycle,
      daysPresent,
      daysAbsent,
      totalHours,
      hourlyRate: employee.hourlyRate,
      overtimeHours: 0,
      advanceAmount: 0,
      deductions: { shoes: 0, canteen: 0 },
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
   BUTTON: ALL EMPLOYEES
========================================================= */
export async function calculateMonthlyForAllEmployees(input: {
  cycleTimingId: string;
  year: number;
  month: number;
  departmentId?: string;
}) {
  const { cycleTimingId, year, month, departmentId } = input;

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
