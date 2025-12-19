"use server";

import prisma from "@/lib/prisma";

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTime(baseDate: Date, hourMin: number, hourMax: number) {
  const d = new Date(baseDate);
  d.setHours(randomBetween(hourMin, hourMax));
  d.setMinutes(randomBetween(0, 59));
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

export async function generateFakeAttendance({
  employeeId,
  months = 2,
}: {
  employeeId: string;
  months?: number;
}) {
  // -----------------------------------------
  // 1️⃣ Get employee
  // -----------------------------------------
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { department: true },
  });

  if (!employee) throw new Error("Employee not found");

  // -----------------------------------------
  // 2️⃣ Get / create scanner user
  // -----------------------------------------
  let user = await prisma.user.findFirst({
    where: {
      role: { in: ["admin", "supervisor"] },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        username: "system_supervisor",
        password: "dev_only",
        role: "supervisor",
        departmentId: employee.departmentId,
      },
    });
  }

  // -----------------------------------------
  // 3️⃣ Wallet
  // -----------------------------------------
  let wallet = await prisma.attendanceWallet.findUnique({
    where: { employeeId },
  });

  if (!wallet) {
    wallet = await prisma.attendanceWallet.create({
      data: { employeeId },
    });
  }

  // -----------------------------------------
  // 4️⃣ Generate realistic fake data
  // -----------------------------------------
  const entries: any[] = [];
  const today = new Date();

  for (let m = 0; m < months; m++) {
    const monthDate = new Date(today);
    monthDate.setMonth(today.getMonth() - m);

    const daysInMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0
    ).getDate();

    // 👉 Only 4–8 days per month
    const workingDaysCount = randomBetween(2, 4);
    const usedDays = new Set<number>();

    while (usedDays.size < workingDaysCount) {
      usedDays.add(randomBetween(1, daysInMonth));
    }

    for (const day of usedDays) {
      const baseDate = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        day
      );

      // 👉 2–4 IN/OUT pairs per day
      const pairs = randomBetween(2, 4);
      let lastOut: Date | null = null;

      for (let p = 0; p < pairs; p++) {
        const inTime = lastOut
          ? randomTime(lastOut, lastOut.getHours() + 1, lastOut.getHours() + 2)
          : randomTime(baseDate, 8, 11);

        const outTime = randomTime(inTime, inTime.getHours() + 1, inTime.getHours() + 3);

        entries.push(
          {
            timestamp: inTime,
            scanType: "in",
            departmentId: employee.departmentId,
            scannedBy: user.id,
            walletId: wallet.id,
            autoClosed: false,
          },
          {
            timestamp: outTime,
            scanType: "out",
            departmentId: employee.departmentId,
            scannedBy: user.id,
            walletId: wallet.id,
            autoClosed: false,
          }
        );

        lastOut = outTime;
      }
    }
  }

  // -----------------------------------------
  // 5️⃣ Insert
  // -----------------------------------------
  await prisma.attendanceEntry.createMany({
    data: entries,
  });

  return {
    success: true,
    message: `✅ Fake attendance generated for ${months} months`,
  };
}
