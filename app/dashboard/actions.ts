"use server"

import mongoose from "mongoose"
import { scanEmployee as scanEmployeeAction } from "@/actions/attendance"
import EmployeeModel, { IEmployee } from "@/lib/models/Employee"

export type ScanResult = {
    employeeId: string
    employeeName: string
    lastScanType: "in" | "out"
}

export async function scanEmployee(empCode: string): Promise<ScanResult> {
    // 🔹 Find employee by empCode
    const employee: IEmployee | null = await EmployeeModel.findOne({ empCode })
    if (!employee) {
        throw new Error("Employee not found with given EmpCode")
    }

    const employeeId = employee._id

    // 🔹 Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        throw new Error("Invalid employee ID in database")
    }

    try {
        // 🔹 Scan employee (auto decides IN or OUT based on last entry)
        const result = await scanEmployeeAction({ empCode })

        return {
            employeeId: employee._id.toString(),
            employeeName: employee.name,
            lastScanType: result.lastScanType,
        }
    } catch (err: any) {
        console.error("Error scanning employee:", err)
        throw new Error(err.message || "Unknown error occurred while scanning employee")
    }
}
