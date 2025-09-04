"use server"

import { scanEmployee as scanEmployeeAction } from "@/actions/attendance"
import mongoose from "mongoose"

export type ScanResult = {
    employeeId: string
    lastScanType: "in" | "out"
}

export async function scanEmployee(employeeId: string): Promise<ScanResult> {
    // 🔹 Validate employeeId format for Mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        throw new Error("Invalid employee ID format. Must be a 24-character hex string.")
    }

    try {
        // 🔹 Scan employee (auto decides IN or OUT based on last entry)
        const result = await scanEmployeeAction({ employeeId: new mongoose.Types.ObjectId(employeeId) })
        return {
            employeeId,
            lastScanType: result.lastScanType
        }
    } catch (err: any) {
        console.error("Error scanning employee:", err)
        throw new Error(err.message || "Unknown error occurred while scanning employee")
    }
}
