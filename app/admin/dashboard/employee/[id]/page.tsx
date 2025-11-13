// app/admin/dashboard/employee/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import { getEmployeeById } from "@/actions/employeeActions";
import { getDepartmentById } from "@/actions/department";
import { getShiftTypeById } from "@/actions/shiftType";
import { getCycleTimingById } from "@/actions/cycleTimings";

import { calculateWorkLogs, getAttendanceWallet } from "@/actions/attendance";

import EmployeeInfoCard from "@/components/admin/EmployeeInfoCard";
import WorkLogTable from "@/components/admin/WorkLogTable";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id;

  const [employee, setEmployee] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);
  const [shiftType, setShiftType] = useState<any>(null);
  const [cycleTiming, setCycleTiming] = useState<any>(null);

  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [dayEntries, setDayEntries] = useState<any[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // -----------------------------------------
  // Load Employee + all related info
  // -----------------------------------------
  const loadEmployee = useCallback(async () => {
    if (!employeeId) return;

    const empRes = await getEmployeeById(employeeId);
    if (!empRes.success || !empRes.data) return router.push("/");

    const emp = empRes.data;
    setEmployee(emp);

    // Department
    const deptRes = await getDepartmentById(emp.departmentId);
    if (deptRes.success) setDepartment(deptRes.data);

    // Shift Type
    if (emp.shiftTypeId) {
      const shiftRes = await getShiftTypeById(emp.shiftTypeId);
      if (shiftRes.success) setShiftType(shiftRes.data);
    }

    // Cycle Timing
    if (emp.cycleTimingId) {
      const cycleRes = await getCycleTimingById(emp.cycleTimingId);
      if (cycleRes.success) setCycleTiming(cycleRes.data);
    }

  }, [employeeId, router]);

  // -----------------------------------------
  // Refresh attendance logs (work logs)
  // -----------------------------------------
  const refreshLogs = useCallback(async () => {
    if (!employeeId) return;
    setLoadingLogs(true);

    const wallet = await getAttendanceWallet(employeeId);
    if (!wallet) {
      setWorkLogs([]);
      setDayEntries([]);
      setLoadingLogs(false);
      return;
    }

    const logs = await calculateWorkLogs(wallet.entries, employee?.hourlyRate || 0);
    setWorkLogs(logs);

    // If expanded day → refresh its entries also
    if (expandedDate) {
      const filtered = wallet.entries.filter((e: any) =>
        e.timestamp.toISOString().startsWith(expandedDate)
      );
      setDayEntries(filtered);
    }

    setLoadingLogs(false);
  }, [employeeId, expandedDate, employee?.hourlyRate]);

  useEffect(() => {
    (async () => {
      await loadEmployee();
      await refreshLogs();
    })();
  }, [loadEmployee, refreshLogs]);

  // -----------------------------------------
  // When clicking a specific date to open logs
  // -----------------------------------------
  const handleExpand = async (date: string) => {
    if (!employee) return;

    if (expandedDate === date) {
      setExpandedDate(null);
      setDayEntries([]);
      return;
    }

    const wallet = await getAttendanceWallet(employee.id);
    if (!wallet) return;

    const filtered = wallet.entries.filter((e: any) =>
      e.timestamp.toISOString().startsWith(date)
    );

    setExpandedDate(date);
    setDayEntries(filtered);
  };

  if (!employee) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{employee.name}</h1>
      </div>

      {/* Employee Info Card */}
      <EmployeeInfoCard
        employee={employee}
        department={department}
        shiftType={shiftType}
        cycleTiming={cycleTiming}
      />

      {/* Attendance Logs */}
      {loadingLogs ? (
        <div className="w-full flex flex-col items-center justify-center py-10">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600 text-sm">Loading attendance logs...</p>
        </div>
      ) : (
        <WorkLogTable
          workLogs={workLogs}
          expandedDate={expandedDate}
          dayEntries={dayEntries}
          onExpand={handleExpand}
          employeeId={employee.id}
          onRefresh={refreshLogs}
        />
      )}
    </div>
  );
}
