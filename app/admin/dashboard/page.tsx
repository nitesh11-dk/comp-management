"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { CombinedEmployeeDashboard } from "@/components/admin/employee-management";
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


      {/* ===============================
         MAIN CONTENT - COMBINED DASHBOARD
      =============================== */}
      <CombinedEmployeeDashboard />
    </div>
  );
};

export default Page;
