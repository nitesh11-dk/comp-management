"use server";

import prisma from "@/lib/prisma";
import { ActionResponse } from "@/lib/types/types";

/**
 * READ all shift types
 */
export async function getShiftTypes(): Promise<ActionResponse<any[]>> {
    try {
        const shiftTypes = await prisma.shiftType.findMany({
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            message: "Shift types fetched",
            data: shiftTypes,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message,
            data: [],
        };
    }
}
