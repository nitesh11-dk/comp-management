"use server";

import prisma from "@/lib/prisma";
import { ActionResponse } from "@/lib/types/types";

/**
 * Calculate total hours
 */
function calculateTotalHours(start: Date, end: Date) {
    let diffMs = end.getTime() - start.getTime();

    // If negative → assume shift passes midnight (e.g., 22:00 → 06:00)
    if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000; // add 24 hours
    }

    const hours = diffMs / (1000 * 60 * 60);
    return parseFloat(hours.toFixed(2));
}

/**
 * CREATE SHIFT TYPE
 */
export async function createShiftType(data: {
    name: string;
    startTime: string; // ISO
    endTime: string;   // ISO
}): Promise<ActionResponse<any>> {
    try {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return {
                success: false,
                message: "Invalid start or end time",
            };
        }

        const totalHours = calculateTotalHours(start, end);

        const shift = await prisma.shiftType.create({
            data: {
                name: data.name,
                startTime: start,
                endTime: end,
                totalHours,
            },
        });

        return { success: true, message: "Shift created", data: shift };
    } catch (error: any) {
        console.error("Shift Create Error:", error);
        return { success: false, message: "Shift creation failed" };
    }
}

/**
 * ALL SHIFTS
 */
export async function getShiftTypes(): Promise<ActionResponse<any[]>> {
    try {
        const shifts = await prisma.shiftType.findMany({
            orderBy: { createdAt: "desc" },
        });

        return { success: true, data: shifts, message: "ok" };
    } catch (error: any) {
        return { success: false, message: error.message, data: [] };
    }
}

/**
 * UPDATE SHIFT TYPE
 */
export async function updateShiftType(
    id: string,
    data: { name: string; startTime: string; endTime: string }
): Promise<ActionResponse<any>> {
    try {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return {
                success: false,
                message: "Invalid time format",
                data: null,
            };
        }

        const totalHours = calculateTotalHours(start, end);

        const shift = await prisma.shiftType.update({
            where: { id },
            data: {
                name: data.name,
                startTime: start,
                endTime: end,
                totalHours,
            },
        });

        return { success: true, message: "Shift updated", data: shift };
    } catch (error: any) {
        console.error("Shift Update Error:", error);

        if (error.code === "P2025") {
            return { success: false, message: "Shift not found", data: null };
        }

        return { success: false, message: "Update failed", data: null };
    }
}

/**
 * DELETE SHIFT TYPE
 */
export async function deleteShiftType(id: string) {
    try {
        // Check if shift type has any employees assigned
        const employeeCount = await prisma.employee.count({
            where: { shiftTypeId: id },
        });

        if (employeeCount > 0) {
            return {
                success: false,
                message: `Cannot delete shift type because it has ${employeeCount} employee(s) assigned. Please reassign them to another shift first.`,
                data: null,
            };
        }

        await prisma.shiftType.delete({ where: { id } });

        return { success: true, message: "Shift deleted", data: null };
    } catch (error: any) {
        if (error.code === "P2003") {
            return {
                success: false,
                message:
                    "❌ Cannot delete. Employees are assigned to this shift. Remove them first.",
                data: null,
            };
        }

        return { success: false, message: "Delete failed", data: null };
    }
}


/**
 * GET ONE SHIFT BY ID
 */
export async function getShiftTypeById(
    id: string
): Promise<ActionResponse<any>> {
    try {
        const shift = await prisma.shiftType.findUnique({
            where: { id },
        });

        if (!shift) {
            return {
                success: false,
                message: "Shift type not found",
                data: null,
            };
        }

        return {
            success: true,
            message: "Shift type fetched",
            data: shift,
        };
    } catch (error: any) {
        return {
            success: false,
            message: "Failed to fetch shift type",
            data: null,
        };
    }
}
