"use server";

import prisma from "@/lib/prisma";
import { ActionResponse } from "@/lib/types/types";

const SETTINGS_KEY = 'dashboard_column_visibility';

export async function updateGlobalSettings(columnVisibility: any): Promise<ActionResponse<any>> {
    try {
        const id = 'global-settings';
        await prisma.$executeRawUnsafe(`
      INSERT INTO "SystemSetting" ("id", "key", "value", "updatedAt")
      VALUES ($1, $2, CAST($3 AS jsonb), NOW())
      ON CONFLICT ("key") DO UPDATE
      SET "value" = CAST($3 AS jsonb), "updatedAt" = NOW()
    `, id, SETTINGS_KEY, JSON.stringify({ columnVisibility }));

        return {
            success: true,
            message: "Global column visibility updated successfully",
            data: columnVisibility,
        };
    } catch (error: any) {
        console.error("❌ Update Global Settings Error:", error);
        return { success: false, message: error.message || "Failed to update global settings" };
    }
}

export async function getGlobalSettings(): Promise<ActionResponse<any>> {
    try {
        const results: any[] = await prisma.$queryRawUnsafe(`
      SELECT "value" FROM "SystemSetting" WHERE "key" = $1 LIMIT 1
    `, SETTINGS_KEY);

        if (!results || results.length === 0) {
            return {
                success: true,
                message: "No global settings found",
                data: null,
            };
        }

        return {
            success: true,
            message: "Global settings fetched successfully",
            data: results[0].value,
        };
    } catch (error: any) {
        console.error("❌ Get Global Settings Error:", error);
        return { success: false, message: error.message || "Failed to fetch global settings" };
    }
}
