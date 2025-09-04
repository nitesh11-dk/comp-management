"use server"

import mongoose from "mongoose"
import { scanEmployee as scanEmployeeAction } from "@/actions/attendance"
import EmployeeModel, { IEmployee } from "@/lib/models/Employee"

export type ScanResult = {
    employeeName: string
    empCode: string // <-- include empCode for UI display
    lastScanType?: "in" | "out"
}

export async function scanEmployee(empCode: string): Promise<ScanResult> {
    // 🔹 Find employee by empCode
    const employee: IEmployee | null = await EmployeeModel.findOne({ empCode })
    if (!employee) {
        throw new Error("Employee not found with given EmpCode")
    }

    try {
        // 🔹 Scan employee (auto decides IN or OUT based on last entry)
        const result = await scanEmployeeAction({ empCode })

        return {
            empCode: employee.empCode, // show empCode instead of _id
            employeeName: employee.name,
            lastScanType: result.lastScanType,
        }
    } catch (err: any) {
        console.error("Error scanning employee:", err)
        throw new Error(err.message || "Unknown error occurred while scanning employee")
    }
}
