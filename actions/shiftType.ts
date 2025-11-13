
"use server";

import prisma from "@/lib/prisma";
import { ActionResponse } from "@/lib/types/types";

/**
 * AUTO CALCULATE TOTAL HOURS
 */
function calculateTotalHours(start: Date, end: Date) {
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return parseFloat(hours.toFixed(2));
}

/**
 * CREATE SHIFT TYPE
 */
export async function createShiftType(data: {
    name: string;
    startTime: string;
    endTime: string;
}): Promise<ActionResponse<any>> {
    try {
        const start = new Date(`2000-01-01T${data.startTime}:00`);
        const end = new Date(`2000-01-01T${data.endTime}:00`);

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
        return { success: false, message: error.message };
    }
}

/**
 * GET ALL SHIFT TYPES
 */
export async function getShiftTypes(): Promise<ActionResponse<any[]>> {
    try {
        const shifts = await prisma.shiftType.findMany({
            orderBy: { createdAt: "desc" },
        });

        return { success: true, message: "Shifts fetched", data: shifts };
    } catch (error: any) {
        return { success: false, message: error.message, data: [] };
    }
}

/**
 * GET ONE SHIFT BY ID
 */
export async function getShiftTypeById(
    id: string
): Promise<ActionResponse<any | null>> {
    try {
        const shift = await prisma.shiftType.findUnique({ where: { id } });

        if (!shift)
            return { success: false, message: "Shift not found", data: null };

        return { success: true, message: "Shift fetched", data: shift };
    } catch (error: any) {
        return { success: false, message: error.message, data: null };
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
        // 🛑 Validate missing times
        if (!data.startTime || !data.endTime) {
            return {
                success: false,
                message: "Start time and End time are required",
                data: null,
            };
        }

        // 🟢 Convert HH:mm → valid ISO time for DB
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        const startISO = `${today}T${data.startTime}:00.000Z`;
        const endISO = `${today}T${data.endTime}:00.000Z`;

        const start = new Date(startISO);
        const end = new Date(endISO);

        // 🛑 Validate if Date is invalid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return {
                success: false,
                message: "Invalid time format",
                data: null,
            };
        }

        // 🟢 Calculate Hours
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
export async function deleteShiftType(
    id: string
): Promise<ActionResponse<null>> {
    try {
        await prisma.shiftType.delete({ where: { id } });

        return { success: true, message: "Shift deleted", data: null };
    } catch (error: any) {

        // 🔥 FK Constraint error (Employees using this shift)
        if (error.code === "P2003") {
            return {
                success: false,
                message:
                    "❌ Cannot delete this shift because employees are assigned to it. Reassign employees first.",
                data: null,
            };
        }

        if (error.code === "P2025") {
            return { success: false, message: "Shift not found", data: null };
        }

        return {
            success: false,
            message: "Something went wrong while deleting shift.",
            data: null,
        };
    }
}
