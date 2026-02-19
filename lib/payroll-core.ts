import { sumDeductions } from "./payroll-utils";

interface PayrollInput {
    totalHours: number;
    hourlyRate: number;
    overtimeHours: number;
    advanceAmount: number;
    deductions: any;
    daysPresent: number;
    pfActive: boolean;
    pfAmountPerDay: number | null;
    esicActive: boolean;
    // Note: esicAmountPerDay is not in the model yet, adding for future compatibility
    esicAmountPerDay?: number | null;
}

/**
 * CORE PAYROLL CALCULATION LOGIC
 * This is the single source of truth for salary calculations.
 */
export function calculateSalaryComponents(input: PayrollInput) {
    const {
        totalHours,
        hourlyRate,
        overtimeHours,
        advanceAmount,
        deductions,
        daysPresent,
        pfActive,
        pfAmountPerDay,
        esicActive,
    } = input;

    // 1. Calculate Gross Salary (Regular Hours + Overtime)
    // Formula: (Total Regular Hours + Overtime Hours) * Hourly Rate
    const combinedHours = (totalHours || 0) + (overtimeHours || 0);
    const grossSalary = Math.round(combinedHours * hourlyRate * 100) / 100;

    // 2. PF Deduction
    // Only if pfActive is true and amount is set
    const pfDeduction = (pfActive && pfAmountPerDay)
        ? Math.round(pfAmountPerDay * daysPresent * 100) / 100
        : 0;

    // 3. Other Deductions (JSON from modal)
    const otherDeductions = sumDeductions(deductions);

    // 4. Net Salary Calculation
    // Formula: Gross - Advance - Other Deductions - PF
    const netSalary = Math.round(
        (grossSalary - advanceAmount - otherDeductions - pfDeduction) * 100
    ) / 100;

    return {
        grossSalary,
        pfDeduction,
        otherDeductions,
        netSalary,
        combinedHours,
    };
}
