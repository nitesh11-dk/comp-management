"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import CombinedEmployeeDashboard from "@/components/admin/employee-management";
import { createFakeEmployees } from "@/actions/createFakeEmployee";

const Page = () => {
  const router = useRouter();

  // 🔄 SERVER ACTION STATE
  const [isPending, startTransition] = useTransition();

  const handleCreateFakeEmployees = () => {
    startTransition(async () => {
      const res = await createFakeEmployees(1);

      if (!res.success) {
        alert(res.message || "Failed to create fake employees");
        return;
      }

      alert(res.message);
    });
  };

  return (
    <div className=" md:p-6 space-y-6">
      {/* ===============================
         TOP ACTION BAR
      =============================== */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* QUICK NAV BUTTONS */}
        <Button
          variant="outline"
          onClick={() => router.push("/admin/dashboard/departments")}
        >
          Manage Departments
        </Button>

        {/* <Button
          disabled={isPending}
          onClick={handleCreateFakeEmployees}
        >
          {isPending ? "Creating..." : "Create Fake Employees"}
        </Button> */}

        <Button
          variant="outline"
          onClick={() => router.push("/admin/dashboard/shift-types")}
        >
          Manage Shifts
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/dashboard/cycle-time")}
        >
          Cycle Timing
        </Button>
      </div>

      {/* ===============================
         MAIN CONTENT - COMBINED DASHBOARD
      =============================== */}
      <CombinedEmployeeDashboard />
    </div>
  );
};

export default Page;
