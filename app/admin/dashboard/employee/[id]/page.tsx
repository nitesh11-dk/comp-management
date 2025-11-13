
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import { getEmployeeById } from "@/actions/employeeActions";
import { getDepartmentById } from "@/actions/department";
import { getShiftTypeById } from "@/actions/shiftType";

import { calculateWorkLogs, getAttendanceWallet } from "@/actions/attendance";

import EmployeeInfoCard from "@/components/admin/EmployeeInfoCard";
import WorkLogTable from "@/components/admin/WorkLogTable";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [employee, setEmployee] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);
  const [shiftType, setShiftType] = useState<any>(null);

  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [dayEntries, setDayEntries] = useState<any[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!params.id) return;

      // Fetch employee
      const empRes = await getEmployeeById(params.id);
      if (!empRes.success || !empRes.data) return router.push("/");

      const emp = empRes.data;
      setEmployee(emp);

      // Fetch department
      const deptRes = await getDepartmentById(emp.departmentId);
      if (deptRes.success) setDepartment(deptRes.data);

      // Fetch Shift Type (IMPORTANT)
      if (emp.shiftTypeId) {
        const shiftRes = await getShiftTypeById(emp.shiftTypeId);
        if (shiftRes.success) setShiftType(shiftRes.data);
      }

      // Fetch Attendance
      setLoadingLogs(true);

      const wallet = await getAttendanceWallet(emp.id);
      if (wallet?.entries?.length) {
        const logs = await calculateWorkLogs(wallet.entries, emp.hourlyRate);
        setWorkLogs(logs);
      }

      setLoadingLogs(false);
    };

    load();
  }, [params.id]);

  // Expand logs by date
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

      {/* UPDATED INFO CARD WITH SHIFT TYPE */}
      <EmployeeInfoCard
        employee={employee}
        department={department}
        shiftType={shiftType}
      />

      {/* Loader BEFORE WorkLogTable */}
      {loadingLogs ? (
        <div className="w-full flex flex-col items-center justify-center py-10">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600 text-sm">Loading attendance logs...</p>

          <div className="w-full max-w-5xl mt-6 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 animate-pulse rounded-md"
              ></div>
            ))}
          </div>
        </div>
      ) : (
        <WorkLogTable
          workLogs={workLogs}
          expandedDate={expandedDate}
          dayEntries={dayEntries}
          onExpand={handleExpand}
        />
      )}
    </div>
  );
}




