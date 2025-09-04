"use server"

import mongoose from "mongoose"
import { scanEmployee as scanEmployeeAction } from "@/actions/attendance"
import EmployeeModel, { IEmployee } from "@/lib/models/Employee"

export type ScanResult = {
    employeeId: string
    employeeName: string
    lastScanType: "in" | "out"
}

export async function scanEmployee(employeeId: string): Promise<ScanResult> {
    // 🔹 Validate employeeId format
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        throw new Error("Invalid employee ID format. Must be a 24-character hex string.")
    }

    // 🔹 Fetch employee details
    const employee: IEmployee | null = await EmployeeModel.findById(employeeId)
    if (!employee) throw new Error("Employee not found")

    try {
        // 🔹 Scan employee (auto decides IN or OUT based on last entry)
        const result = await scanEmployeeAction({ employeeId: new mongoose.Types.ObjectId(employeeId) })

        return {
            employeeId: employee._id.toString(),
            employeeName: employee.name,
            lastScanType: result.lastScanType
        }
    } catch (err: any) {
        console.error("Error scanning employee:", err)
        throw new Error(err.message || "Unknown error occurred while scanning employee")
    }
}
