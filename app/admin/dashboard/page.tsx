"use client";

import EmployeeManagement from "@/components/admin/employee-management";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

const Page = () => {
    const router = useRouter();

    return (
        <div className="p-6 space-y-4">
            {/* Manage Departments Button */}
            <Button
                variant="default"
                onClick={() => router.push("/admin/dashboard/departments")}
                className="mb-4 m-2"
            >
                Manage Departments
            </Button>
            <Button
                variant="default"
                onClick={() => router.push("/admin/dashboard/shift-types")}
                className="mb-4 m-2"
            >
                Manage Shifts
            </Button>

            {/* Employee Management */}
            <EmployeeManagement />
        </div>
    );
};

export default Page;
