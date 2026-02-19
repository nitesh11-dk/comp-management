import dayjs from "dayjs";
import { resolveCycleDates, getSalaryMonthInfo } from "../lib/payroll-utils";

function test() {
    console.log("--- Running Attendance Logic Tests ---");

    // Case 1: 26 -> 25 NEXT_MONTH (Standard cross-month)
    const case1 = getSalaryMonthInfo(new Date(2026, 0, 15), { startDay: 26, endDay: 25, span: "NEXT_MONTH" });
    console.log("Case 1 (26 -> 25 NEXT_MONTH, Ref Jan 15):", {
        start: dayjs(case1.cycleStart).format("YYYY-MM-DD"),
        end: dayjs(case1.cycleEnd).format("YYYY-MM-DD"),
        salaryMonth: case1.salaryMonth,
        daysInSalaryMonth: case1.daysInSalaryMonth
    });

    // Case 2: 25 -> 24 NEXT_MONTH (Feb -> Mar cross-month)
    const case2 = getSalaryMonthInfo(new Date(2026, 2, 15), { startDay: 25, endDay: 24, span: "NEXT_MONTH" });
    console.log("Case 2 (25 -> 24 NEXT_MONTH, Ref Mar 15):", {
        start: dayjs(case2.cycleStart).format("YYYY-MM-DD"),
        end: dayjs(case2.cycleEnd).format("YYYY-MM-DD"),
        salaryMonth: case2.salaryMonth,
        daysInSalaryMonth: case2.daysInSalaryMonth
    });

    // Case 3: 1 -> 31 SAME_MONTH (Full month)
    const case3 = getSalaryMonthInfo(new Date(2026, 0, 15), { startDay: 1, endDay: 31, span: "SAME_MONTH" });
    console.log("Case 3 (1 -> 31 SAME_MONTH):", {
        start: dayjs(case3.cycleStart).format("YYYY-MM-DD"),
        end: dayjs(case3.cycleEnd).format("YYYY-MM-DD"),
        salaryMonth: case3.salaryMonth,
        daysInSalaryMonth: case3.daysInSalaryMonth
    });

    // Case 4: 10 -> 9 NEXT_MONTH (Start 10th Feb -> End 9th Mar)
    // Feb has 19 days, Mar has 9 days. Feb should win.
    const case4 = getSalaryMonthInfo(new Date(2026, 2, 15), { startDay: 10, endDay: 9, span: "NEXT_MONTH" });
    console.log("Case 4 (10 -> 9 NEXT_MONTH, Ref Mar 15):", {
        start: dayjs(case4.cycleStart).format("YYYY-MM-DD"),
        end: dayjs(case4.cycleEnd).format("YYYY-MM-DD"),
        salaryMonth: case4.salaryMonth,
        daysInSalaryMonth: case4.daysInSalaryMonth
    });

    // Case 5: 16 -> 15 NEXT_MONTH (Standard split 15/16)
    // 16 -> 31 = 16 days. 1 -> 15 = 15 days. Month A wins.
    const case5 = getSalaryMonthInfo(new Date(2026, 0, 15), { startDay: 16, endDay: 15, span: "NEXT_MONTH" });
    console.log("Case 5 (16 -> 15 NEXT_MONTH, Ref Jan 15):", {
        start: dayjs(case5.cycleStart).format("YYYY-MM-DD"),
        end: dayjs(case5.cycleEnd).format("YYYY-MM-DD"),
        salaryMonth: case5.salaryMonth,
        daysInSalaryMonth: case5.daysInSalaryMonth
    });
}

test();
