// app/admin/dashboard/employee/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { getEmployeeById } from "@/actions/employeeActions";
import { getDepartmentById } from "@/actions/department";
import { getShiftTypeById } from "@/actions/shiftType";
import { getCycleTimingById } from "@/actions/cycleTimings";
import { calculateMonthlyForEmployee, getMonthlySummaries } from "@/actions/monthlyAttendance";

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

  // Salary calculation state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaryData, setSalaryData] = useState<any>(null);
  const [loadingSalary, setLoadingSalary] = useState(false);

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
        emp.shiftTypeId ? getShiftTypeById(emp.shiftTypeId) : Promise.resolve({ success: false, data: null }),
        emp.cycleTimingId ? getCycleTimingById(emp.cycleTimingId) : Promise.resolve({ success: false, data: null }),
      ]);

      if (deptRes.success) setDepartment(deptRes.data);
      if (shiftRes.success && shiftRes.data) setShiftType(shiftRes.data);
      if (cycleRes.success && cycleRes.data) setCycleTiming(cycleRes.data);
    } finally {
      setLoadingEmployee(false);
    }
  }, [employeeId, router]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  // -----------------------------------------
  // Calculate Salary
  // -----------------------------------------
  const calculateSalary = useCallback(async () => {
    if (!employee || !cycleTiming) return;

    setLoadingSalary(true);
    try {
      const result = await calculateMonthlyForEmployee({
        employeeId: employee.id,
        cycleTimingId: cycleTiming.id,
        year: selectedYear,
        month: selectedMonth,
      });

      if (result.success && result.data) {
        setSalaryData(result.data);
      } else {
        setSalaryData(null);
      }
    } catch (error) {
      console.error("Error calculating salary:", error);
      setSalaryData(null);
    } finally {
      setLoadingSalary(false);
    }
  }, [employee, cycleTiming, selectedYear, selectedMonth]);

  // Remove auto-calculation - manual trigger only

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

      {/* Salary Calculation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Salary Calculation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">January</SelectItem>
                  <SelectItem value="2">February</SelectItem>
                  <SelectItem value="3">March</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">May</SelectItem>
                  <SelectItem value="6">June</SelectItem>
                  <SelectItem value="7">July</SelectItem>
                  <SelectItem value="8">August</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={calculateSalary}
                disabled={loadingSalary || !employee || !cycleTiming}
                className="w-full sm:w-auto"
              >
                {loadingSalary ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Salary
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Salary Data Display */}
          {loadingSalary ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Calculating salary...</span>
            </div>
          ) : salaryData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Days Present</p>
                <p className="text-lg font-semibold">{salaryData.daysPresent || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Days Absent</p>
                <p className="text-lg font-semibold">{salaryData.daysAbsent || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-lg font-semibold">{salaryData.totalHours?.toFixed(2) || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Overtime Hours</p>
                <p className="text-lg font-semibold">{salaryData.overtimeHours?.toFixed(2) || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="text-lg font-semibold">₹{salaryData.hourlyRate || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Advance</p>
                <p className="text-lg font-semibold">₹{salaryData.advanceAmount || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Deductions</p>
                <p className="text-lg font-semibold">₹{salaryData.deductions ? Object.values(salaryData.deductions as Record<string, number>).reduce((a, b) => a + b, 0) : 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Net Salary</p>
                <p className="text-lg font-semibold text-green-600">₹{salaryData.netSalary?.toFixed(2) || 0}</p>
              </div>
              <div className="space-y-1 col-span-2 md:col-span-4">
                <p className="text-sm text-muted-foreground">PF Amount Per Cycle</p>
                <p className="text-lg font-semibold">₹{(employee?.pfAmountPerDay || 0) * (salaryData.daysPresent || 0)}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Select month and year, then click "Calculate Salary" to view salary details.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

EmployeeProfilePage.displayName = "EmployeeProfilePage";

export default EmployeeProfilePage;
