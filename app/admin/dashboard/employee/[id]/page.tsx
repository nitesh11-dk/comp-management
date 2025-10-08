"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import html2canvas from "html2canvas";
import Barcode from "react-barcode";

import { getEmployeeById } from "@/actions/employeeActions";
import { getDepartmentById } from "@/actions/department";
import { addTestEntries, calculateWorkLogs, getAttendanceWallet } from "@/actions/attendance";

interface Employee {
  _id: string;
  empCode: string;
  name: string;
  mobile: number;
  aadhaarNumber: number;
  pfId?: string;
  esicId?: string;
  departmentId: string;
  shiftType: string;
  hourlyRate: number;
}

interface Department {
  _id: string;
  name: string;
}

interface WorkLog {
  date: Date;
  totalHours: number;
  hours: number;
  minutes: number;
  salaryEarned: number;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const barcodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!params.id) return;
      try {
        const empRes = await getEmployeeById(params.id);
        if (!empRes.success || !empRes.data) { router.push("/"); return; }
        const empData: Employee = empRes.data;
        setEmployee(empData);

        const deptRes = await getDepartmentById(empData.departmentId);
        if (deptRes.success && deptRes.data) setDepartment(deptRes.data);

        const wallet = await getAttendanceWallet(empData._id);
        if (wallet?.entries?.length) {
          const logs = await calculateWorkLogs(wallet.entries, empData.hourlyRate);
          setWorkLogs(logs);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [params.id]);

  const downloadEmployeeBarcode = async () => {
    if (!barcodeRef.current || !employee) return;
    try {
      const canvas = await html2canvas(barcodeRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const link = document.createElement("a");
      link.download = `employee_${employee.empCode}_barcode.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTestEntries = async () => {
    if (!employee?._id) return;
    try {
      await addTestEntries(employee._id);
      alert("Test entries added successfully!");

      const wallet = await getAttendanceWallet(employee._id);
      if (wallet?.entries?.length) {
        const logs = await calculateWorkLogs(wallet.entries, employee.hourlyRate);
        setWorkLogs(logs);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add test entries.");
    }
  };

  if (!employee) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{employee.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Employee Info</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p><strong>EmpCode:</strong> {employee.empCode}</p>
            <p><strong>Name:</strong> {employee.name}</p>
            <p><strong>Mobile:</strong> {employee.mobile}</p>
            <p><strong>Aadhaar:</strong> {employee.aadhaarNumber}</p>
            <p><strong>PF ID:</strong> {employee.pfId || "N/A"}</p>
            <p><strong>ESIC ID:</strong> {employee.esicId || "N/A"}</p>
            <p><strong>Department:</strong> {department?.name || "N/A"}</p>
            <p><strong>Shift Type:</strong> {employee.shiftType}</p>
            <p><strong>Hourly Rate:</strong> ₹{employee.hourlyRate}</p>

            <Button variant="outline" className="mt-4" onClick={handleAddTestEntries}>
              Add Test Entries
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Barcode</CardTitle></CardHeader>
          <CardContent className="text-center flex flex-col items-center gap-4">
            <div ref={barcodeRef} className="p-4 bg-white inline-block">
              <Barcode value={employee.empCode} width={2} height={60} fontSize={14} />
            </div>
            <Button variant="outline" onClick={downloadEmployeeBarcode} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Barcode
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Daily Work Logs</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Date</th>
                <th className="border px-4 py-2 text-left">Total Hours</th>
                <th className="border px-4 py-2 text-left">Salary Earned</th>
              </tr>
            </thead>
            <tbody>
              {workLogs.length ? workLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{log.date.toISOString().split("T")[0]}</td>
                  <td className="border px-4 py-2">{log.hours} hrs {log.minutes} mins</td>
                  <td className="border px-4 py-2">₹{log.salaryEarned}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="border px-4 py-2 text-center">
                    No work logs available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
