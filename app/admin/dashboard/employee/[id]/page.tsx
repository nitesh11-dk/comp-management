// app/admin/dashboard/employee/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";

import { getEmployeeById } from "@/actions/employeeActions";
import { getDepartmentById } from "@/actions/department";
import { getShiftTypeById } from "@/actions/shiftType";
import { getCycleTimingById } from "@/actions/cycleTimings";

import EmployeeInfoCard from "@/components/admin/EmployeeInfoCard";

const EmployeeProfilePage = memo(function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);
  const [shiftType, setShiftType] = useState<any>(null);
  const [cycleTiming, setCycleTiming] = useState<any>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);

  // -----------------------------------------
  // Load Employee + all related info
  // -----------------------------------------
  const loadEmployee = useCallback(async () => {
    if (!employeeId) return;
    setLoadingEmployee(true);

    try {
      const empRes = await getEmployeeById(employeeId);
      if (!empRes.success || !empRes.data) {
        router.push("/");
        return;
      }

      const emp = empRes.data;
      setEmployee(emp);

      // Parallel fetch for better performance
      const [deptRes, shiftRes, cycleRes] = await Promise.all([
        getDepartmentById(emp.departmentId),
        emp.shiftTypeId ? getShiftTypeById(emp.shiftTypeId) : Promise.resolve({ success: false }),
        emp.cycleTimingId ? getCycleTimingById(emp.cycleTimingId) : Promise.resolve({ success: false }),
      ]);

      if (deptRes.success) setDepartment(deptRes.data);
      if (shiftRes.success) setShiftType(shiftRes.data);
      if (cycleRes.success) setCycleTiming(cycleRes.data);
    } finally {
      setLoadingEmployee(false);
    }
  }, [employeeId, router]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  if (loadingEmployee || !employee) return (
    <div className="p-4 md:p-6">
      <div className="w-full flex flex-col items-center justify-center py-10">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-600 text-sm">Loading employee details...</p>
      </div>
    </div>
  );

  return (
    <div className="p-2 md:p-6 space-y-4 md:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} size="sm" className="self-start">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{employee.name}</h1>
            <p className="text-muted-foreground">Employee Code: {employee.empCode}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/dashboard/employee/${employeeId}/attendance`)}
            className="self-start"
          >
            <Calendar className="h-4 w-4 mr-2" />
            View Attendance
          </Button>
        </div>
      </div>

      {/* Employee Info Card */}
      <EmployeeInfoCard
        employee={employee}
        department={department}
        shiftType={shiftType}
        cycleTiming={cycleTiming}
      />
    </div>
  );
});

EmployeeProfilePage.displayName = "EmployeeProfilePage";

export default EmployeeProfilePage;
