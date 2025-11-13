"use server";

import prisma from "@/lib/prisma";
import { getUserFromCookies } from "@/lib/auth";
import { ActionResponse } from "@/lib/types/types";

/**
 * CREATE a new department
 */
export async function createDepartment(
    data: { name: string; description?: string }
): Promise<ActionResponse<any>> {
    try {
        const department = await prisma.department.create({
            data,
        });

        return {
            success: true,
            message: "Department created",
            data: department,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message,
        };
    }
}

/**
 * READ all departments
 */
export async function getDepartments(): Promise<
    ActionResponse<any[]>
> {
    try {
        const departments = await prisma.department.findMany({
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            message: "Departments fetched",
            data: departments,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message,
            data: [],
        };
    }
}

/**
 * READ one department by ID
 */
export async function getDepartmentById(
    id: string
): Promise<ActionResponse<any | null>> {
    try {
        const department = await prisma.department.findUnique({
            where: { id },
        });

        if (!department) {
            return {
                success: false,
                message: "Department not found",
                data: null,
            };
        }

        return {
            success: true,
            message: "Department fetched",
            data: department,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message,
            data: null,
        };
    }
}

/**
 * UPDATE department by ID
 */
export async function updateDepartment(
    id: string,
    data: Partial<{ name: string; description: string }>
): Promise<ActionResponse<any | null>> {
    try {
        const department = await prisma.department.update({
            where: { id },
            data,
        });

        return {
            success: true,
            message: "Department updated",
            data: department,
        };
    } catch (error: any) {
        if (error.code === "P2025") {
            return {
                success: false,
                message: "Department not found",
                data: null,
            };
        }

        return {
            success: false,
            message: error.message,
            data: null,
        };
    }
}

/**
 * DELETE department by ID
 */
export async function deleteDepartment(
    id: string
): Promise<ActionResponse<null>> {
    try {
        await prisma.department.delete({
            where: { id },
        });

        return {
            success: true,
            message: "Department deleted",
            data: null,
        };
    } catch (error: any) {
        if (error.code === "P2025") {
            return {
                success: false,
                message: "Department not found",
                data: null,
            };
        }

        return {
            success: false,
            message: error.message,
            data: null,
        };
    }
}

/**
 * GET CURRENT USER'S DEPARTMENT
 */
export async function getCurrentUserDepartment(): Promise<
    ActionResponse<any | null>
> {
    try {
        const user = await getUserFromCookies();
        if (!user) {
            return {
                success: false,
                message: "User not authenticated",
                data: null,
            };
        }

        if (!user.departmentId) {
            return {
                success: false,
                message: "User has no assigned department",
                data: null,
            };
        }

        const department = await prisma.department.findUnique({
            where: { id: user.departmentId },
        });

        if (!department) {
            return {
                success: false,
                message: "Department not found",
                data: null,
            };
        }

        return {
            success: true,
            message: "User department fetched",
            data: department,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message,
            data: null,
        };
    }
}
