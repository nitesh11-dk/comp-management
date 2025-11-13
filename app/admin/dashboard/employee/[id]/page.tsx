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

interface RawEntry {
  id: string;
  timestamp: Date;
  scanType: "in" | "out";
  departmentId: string;
  autoClosed: boolean;
  department?: {
    name: string;
  };
}

interface Employee {
  id: string;
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
  id: string;
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
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dayEntries, setDayEntries] = useState<RawEntry[]>([]);
  const barcodeRef = useRef<HTMLDivElement>(null);




  useEffect(() => {
    const loadData = async () => {
      if (!params.id) return;
      try {
        const empRes = await getEmployeeById(params.id);
        if (!empRes.success || !empRes.data) return router.push("/");

        const empData = empRes.data;
        setEmployee(empData);

        const deptRes = await getDepartmentById(empData.departmentId);
        if (deptRes.success && deptRes.data) setDepartment(deptRes.data);

        const wallet = await getAttendanceWallet(empData.id);
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

  const handleRowClick = async (date: Date) => {
    if (!employee) return;

    const dateKey = date.toISOString().slice(0, 10);

    if (expandedDate === dateKey) {
      setExpandedDate(null);
      setDayEntries([]);
      return;
    }

    const wallet = await getAttendanceWallet(employee.id);
    if (!wallet) return;

    const entriesForTheDay = wallet.entries.filter((e) =>
      e.timestamp.toISOString().startsWith(dateKey)
    );

    setExpandedDate(dateKey);
    setDayEntries(entriesForTheDay);
  };

  const downloadEmployeeBarcode = async () => {
    if (!barcodeRef.current || !employee) return;

    const canvas = await html2canvas(barcodeRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const link = document.createElement("a");
    link.download = `employee_${employee.empCode}_barcode.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!employee) return <div className="p-6">Loading...</div>;

  // Group logs by month
  const groupedLogs: Record<string, WorkLog[]> = {};
  workLogs.forEach((log) => {
    const monthName = log.date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    if (!groupedLogs[monthName]) groupedLogs[monthName] = [];
    groupedLogs[monthName].push(log);
  });

  const sortedMonths = Object.keys(groupedLogs).sort((a, b) => {
    const dateA = new Date(groupedLogs[a][0].date);
    const dateB = new Date(groupedLogs[b][0].date);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{employee.name}</h1>
      </div>

      {/* Employee Info & Barcode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Info</CardTitle>
          </CardHeader>
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
          </CardContent>
        </Card>

        {/* Barcode */}
        <Card>
          <CardHeader><CardTitle>Barcode</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div ref={barcodeRef} className="p-4 bg-white">
              <Barcode value={employee.empCode} height={60} fontSize={14} />
            </div>
            <Button variant="outline" onClick={downloadEmployeeBarcode}>
              <Download className="h-4 w-4 mr-2" /> Download Barcode
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Work Logs with Expandable Rows */}
      {sortedMonths.map((month, idx) => (
        <div key={idx} className="flex flex-col items-center space-y-2">
          <h2 className="text-xl font-semibold mt-4">{month}</h2>

          <Card className="w-full max-w-5xl shadow-lg">
            <CardContent className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Date</th>
                    <th className="border px-4 py-2 text-left">Hours</th>
                    <th className="border px-4 py-2 text-left">Salary</th>
                  </tr>
                </thead>

                <tbody>
                  {groupedLogs[month]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((log, i) => {
                      const dateKey = log.date.toISOString().slice(0, 10);
                      const isExpanded = expandedDate === dateKey;

                      return (
                        <>
                          {/* Normal Row */}
                          <tr
                            key={dateKey}
                            onClick={() => handleRowClick(log.date)}
                            className="cursor-pointer hover:bg-blue-50 transition"
                          >
                            <td className="border px-4 py-2">
                              {dateKey}
                            </td>
                            <td className="border px-4 py-2">
                              {log.hours}h {log.minutes}m
                            </td>
                            <td className="border px-4 py-2">
                              ₹{log.salaryEarned}
                            </td>
                          </tr>

                          {/* Expanded Row */}
                          {isExpanded && (
                            <tr>
                              <td
                                colSpan={3}
                                className="border px-4 py-3 bg-gray-50"
                              >
                                <h3 className="font-semibold mb-2">
                                  In–Out Details
                                </h3>

                                <table className="w-full text-sm border">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="border px-2 py-1">
                                        Type
                                      </th>
                                      <th className="border px-2 py-1">
                                        Time
                                      </th>
                                      <th className="border px-2 py-1">
                                        Department
                                      </th>
                                      <th className="border px-2 py-1">
                                        Auto Closed
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {dayEntries.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan={4}
                                          className="text-center p-2 text-gray-500"
                                        >
                                          No entries found.
                                        </td>
                                      </tr>
                                    ) : (
                                      dayEntries.map((e, idx2) => (
                                        <tr key={idx2}>
                                          <td className="border px-2 py-1">
                                            {e.scanType.toUpperCase()}
                                          </td>
                                          <td className="border px-2 py-1">
                                            {new Date(
                                              e.timestamp
                                            ).toLocaleTimeString()}
                                          </td>
                                          <td className="border px-2 py-1">
                                            {e.department?.name ||
                                              "Unknown"}
                                          </td>
                                          <td className="border px-2 py-1">
                                            {e.autoClosed ? "Yes" : "No"}
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
