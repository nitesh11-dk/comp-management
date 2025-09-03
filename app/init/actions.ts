"use server";

import mongoose from "mongoose";
import Department from "@/lib/models/Department";
import connect from "@/lib/mongo";

const departments = [
    {
        name: "Packing Department",
        description: "Product packing and packaging operations",
    },
    {
        name: "Production Department",
        description: "Manufacturing and production operations",
    },
    {
        name: "Quality Control",
        description: "Quality assurance and testing",
    },
];

export async function seedDepartments(): Promise<string> {
    try {
        await connect();

        for (const dept of departments) {
            const exists = await Department.findOne({ name: dept.name });
            if (!exists) {
                await Department.create(dept);
            }
        }

        return "🎉 Departments seeded successfully!";
    } catch (error) {
        console.error(error);
        return "❌ Error seeding departments";
    } finally {
    }
}
