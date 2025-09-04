"use server";

import { getUserFromCookies } from "@/lib/auth";
import Department, { IDepartment } from "@/lib/models/Department";
import connect from "@/lib/mongo";
import { ActionResponse } from "@/lib/types/types";

/**
 * CREATE a new department
 */
export async function createDepartment(
    data: { name: string; description?: string }
): Promise<ActionResponse<IDepartment>> {
    try {
        await connect();
        const department = await Department.create(data);
        return { success: true, message: "Department created", data: department };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

/**
 * READ all departments
 */
export async function getDepartments(): Promise<
    ActionResponse<IDepartment[]>
> {
    try {
        await connect();
        const departments = await Department.find().sort({ createdAt: -1 });
        return { success: true, message: "Departments fetched", data: departments };
    } catch (error: any) {
        return { success: false, message: error.message, data: [] };
    }
}

/**
 * READ one department by ID
 */
export async function getDepartmentById(
    id: string
): Promise<ActionResponse<IDepartment | null>> {
    try {
        await connect();
        const department = await Department.findById(id);
        if (!department) {
            return { success: false, message: "Department not found", data: null };
        }
        return { success: true, message: "Department fetched", data: department };
    } catch (error: any) {
        return { success: false, message: error.message, data: null };
    }
}

/**
 * UPDATE department by ID
 */
export async function updateDepartment(
    id: string,
    data: Partial<{ name: string; description: string }>
): Promise<ActionResponse<IDepartment | null>> {
    try {
        await connect();
        const department = await Department.findByIdAndUpdate(id, data, {
            new: true,
        });
        if (!department) {
            return { success: false, message: "Department not found", data: null };
        }
        return { success: true, message: "Department updated", data: department };
    } catch (error: any) {
        return { success: false, message: error.message, data: null };
    }
}

/**
 * DELETE department by ID
 */
export async function deleteDepartment(
    id: string
): Promise<ActionResponse<null>> {
    try {
        await connect();
        const deleted = await Department.findByIdAndDelete(id);
        if (!deleted) {
            return { success: false, message: "Department not found", data: null };
        }
        return { success: true, message: "Department deleted", data: null };
    } catch (error: any) {
        return { success: false, message: error.message, data: null };
    }
}


export async function getCurrentUserDepartment(): Promise<
    ActionResponse<IDepartment | null>
> {
    try {
        await connect();
        const user = await getUserFromCookies();
        if (!user) {
            return { success: false, message: "User not authenticated", data: null };
        }

        if (!user.departmentId) {
            return { success: false, message: "User has no assigned department", data: null };
        }

        const department = await Department.findById(user.departmentId);
        if (!department) {
            return { success: false, message: "Department not found", data: null };
        }

        return { success: true, message: "User department fetched", data: department };
    } catch (error: any) {
        return { success: false, message: error.message, data: null };
    }
}