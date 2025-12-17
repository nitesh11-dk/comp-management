"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import EmployeeManagement from "@/components/admin/employee-management";
import AdminAttendanceDashboardV2 from "@/components/admin/NewDash";

const Page = () => {
  const router = useRouter();

  // 🔑 VIEW STATE
  const [view, setView] = useState<"attendance" | "employees">(
    "attendance"
  );

  return (
    <div className="p-6 space-y-6">

      {/* ===============================
         TOP ACTION BAR
      =============================== */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* VIEW SELECT */}
        <select
          value={view}
          onChange={(e) =>
            setView(e.target.value as "attendance" | "employees")
          }
          className="border px-3 py-2 rounded"
        >
          <option value="attendance">Attendance Dashboard</option>
          <option value="employees">Employee Management</option>
        </select>

        {/* QUICK NAV BUTTONS */}
        <Button
          variant="outline"
          onClick={() => router.push("/admin/dashboard/departments")}
        >
          Manage Departments
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push("/admin/dashboard/shift-types")}
        >
          Manage Shifts
        </Button>
      </div>

      {/* ===============================
         MAIN CONTENT
      =============================== */}
      <div className="border rounded p-4 bg-white">
        {view === "attendance" && <AdminAttendanceDashboardV2 />}
        {view === "employees" && <EmployeeManagement />}
      </div>
    </div>
  );
};

export default Page;
