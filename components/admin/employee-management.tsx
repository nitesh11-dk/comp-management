"use client";

import { useEffect, useRef, useState } from "react";
import { getEmployees } from "@/actions/employeeActions";
import { getDepartments } from "@/actions/department";
import { getCycleTimings } from "@/actions/cycleTimings";
import {
  getMonthlySummaries,
  calculateMonthlyForAllEmployees,
  calculateMonthlyForEmployee,
} from "@/actions/monthlyAttendance";
import { Button } from "@/components/ui/button";
import { Download, Eye, Edit, Calculator, Filter, Settings } from "lucide-react";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

type Row = {
  employee: any;
  summary: any | null;
};

export default function CombinedEmployeeDashboard() {
  const now = new Date();
  const requestIdRef = useRef(0);
  const barcodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const router = useRouter();

  /* ============================
     MASTER DATA
  ============================ */
  const [employees, setEmployees] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  /* ============================
     FILTERS
  ============================ */
  // Monthly filters
  const [draftMonth, setDraftMonth] = useState(now.getMonth() + 1);
  const [draftYear, setDraftYear] = useState(now.getFullYear());
  const [draftCycleId, setDraftCycleId] = useState<string>("all");

  // Employee search filters
  const [searchField, setSearchField] = useState("name");
  const [searchValue, setSearchValue] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<{
    month: number;
    year: number;
    cycleId: string;
    searchField: string;
    searchValue: string;
  } | null>(null);

  /* ============================
     COLUMN VISIBILITY
  ============================ */
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    empCode: true,
    mobile: true,
    pfId: true,
    pfPerDay: true,
    esicId: true,
    aadhaar: true,
    bankAccount: false,
    ifscCode: false,
    panNumber: false,
    cycle: true,
    present: true,
    absent: true,
    totalHrs: true,
    ot: true,
    rate: true,
    advance: true,
    deductions: true,
    netSalary: true,
    actions: true,
  });

  /* ============================
     LOADING
  ============================ */
  const [loading, setLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const isBusy = loading || recalcLoading !== null;

  /* ============================
     HELPERS
  ============================ */
  const getMonthEnd = (y: number, m: number) => {
    const d = new Date(y, m, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const getCycleById = (id: string) =>
    cycles.find((c) => c.id === id);

  /* ============================
     LOAD INITIAL DATA
  ============================ */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, depRes, cycleRes] = await Promise.all([
          getEmployees(),
          getDepartments(),
          getCycleTimings(),
        ]);

        if (empRes.success) setEmployees(empRes.data || []);
        if (depRes.success) setDepartments(depRes.data || []);
        if (cycleRes.success) {
          setCycles(cycleRes.data || []);
          setDraftCycleId("all");

          // Auto-load data with current month/year/all cycles
          setAppliedFilters({
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            cycleId: "all",
            searchField: "name",
            searchValue: "",
          });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ============================
     SEARCH & FILTER
  ============================ */
  const onSearch = () => {
    if (!draftMonth || !draftYear || !draftCycleId) return;
    setAppliedFilters({
      month: draftMonth,
      year: draftYear,
      cycleId: draftCycleId,
      searchField,
      searchValue,
    });
  };

  /* ============================
     LOAD DASHBOARD
  ============================ */
  const loadDashboard = async (
    month: number,
    year: number,
    cycleId: string,
    searchField: string,
    searchValue: string
  ) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);

    try {
      const monthEnd = getMonthEnd(year, month);
      let result: Row[] = [];

      if (cycleId === "all") {
        const responses = await Promise.all(
          cycles.map((c) =>
            getMonthlySummaries({
              year,
              month,
              cycleTimingId: c.id,
            })
          )
        );

        const flat = responses.flat();
        result = flat.filter(
          (r) => new Date(r.employee.joinedAt) <= monthEnd
        );

        const map = new Map<string, Row>();
        for (const r of result) {
          const key = `${r.employee.id}-${r.summary?.cycleStart ?? "none"}`;
          map.set(key, r);
        }
        result = Array.from(map.values());
      } else {
        const data = await getMonthlySummaries({
          year,
          month,
          cycleTimingId: cycleId,
        });

        result = data.filter(
          (r) => new Date(r.employee.joinedAt) <= monthEnd
        );
      }

      // Apply employee search filter
      if (searchValue.trim()) {
        const value = searchValue.toLowerCase().trim();
        result = result.filter(({ employee }) => {
          switch (searchField) {
            case "name":
            case "empCode":
            case "pfId":
            case "esicId":
            case "aadhaarNumber":
            case "mobile":
            case "bankAccountNumber":
            case "ifscCode":
            case "panNumber":
              return String(employee[searchField] || "")
                .toLowerCase()
                .includes(value);
            default:
              return true;
          }
        });
      }

      if (reqId === requestIdRef.current) setRows(result);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!appliedFilters || cycles.length === 0 || initialLoading) return;
    loadDashboard(
      appliedFilters.month,
      appliedFilters.year,
      appliedFilters.cycleId,
      appliedFilters.searchField,
      appliedFilters.searchValue
    );
  }, [appliedFilters, initialLoading]);

  /* ============================
     RECALC
  ============================ */
  const recalcAll = async () => {
    if (!appliedFilters) return;
    setRecalcLoading("ALL");

    try {
      const { month, year, cycleId } = appliedFilters;

      if (cycleId === "all") {
        await Promise.all(
          cycles.map((c) =>
            calculateMonthlyForAllEmployees({
              year,
              month,
              cycleTimingId: c.id,
            })
          )
        );
      } else {
        await calculateMonthlyForAllEmployees({
          year,
          month,
          cycleTimingId: cycleId,
        });
      }

      await loadDashboard(month, year, cycleId, appliedFilters.searchField, appliedFilters.searchValue);
    } finally {
      setRecalcLoading(null);
    }
  };

  const recalcOne = async (employee: any) => {
    if (!appliedFilters) return;
    setRecalcLoading(employee.id);

    try {
      const cycleToUse =
        appliedFilters.cycleId !== "all"
          ? appliedFilters.cycleId
          : employee.cycleTimingId;

      if (!cycleToUse) return;

      await calculateMonthlyForEmployee({
        employeeId: employee.id,
        year: appliedFilters.year,
        month: appliedFilters.month,
        cycleTimingId: cycleToUse,
      });

      await loadDashboard(
        appliedFilters.month,
        appliedFilters.year,
        appliedFilters.cycleId,
        appliedFilters.searchField,
        appliedFilters.searchValue
      );
    } finally {
      setRecalcLoading(null);
    }
  };

  /* ============================
     DOWNLOAD BARCODE
  ============================ */
  const downloadBarcode = async (empId: string, empCode: string) => {
    const el = barcodeRefs.current[empId];
    if (!el) return;

    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(el, {
      scale: 4,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `${empCode}_barcode.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ============================
     RENDER
  ============================ */
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
        <span className="text-lg">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Employee & Attendance Dashboard</h2>
        <Badge variant="outline" className="text-sm">
          {rows.length} Employees
        </Badge>
      </div>

      {/* FILTERS CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Monthly Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Month</Label>
              <Select disabled={isBusy} value={draftMonth.toString()} onValueChange={(value) => setDraftMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {format(new Date(2020, i, 1), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select disabled={isBusy} value={draftYear.toString()} onValueChange={(value) => setDraftYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: now.getFullYear() - 2020 + 2 }, (_, i) => 2020 + i).map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cycle</Label>
              <Select disabled={isBusy} value={draftCycleId} onValueChange={setDraftCycleId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cycles</SelectItem>
                  {cycles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button disabled={isBusy} onClick={onSearch} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Load Data
              </Button>
            </div>
          </div>

          {/* Employee Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Search Field</Label>
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="empCode">Employee Code</SelectItem>
                  <SelectItem value="pfId">PF ID</SelectItem>
                  <SelectItem value="esicId">ESIC ID</SelectItem>
                  <SelectItem value="aadhaarNumber">Aadhaar Number</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="bankAccountNumber">Bank Account</SelectItem>
                  <SelectItem value="ifscCode">IFSC Code</SelectItem>
                  <SelectItem value="panNumber">PAN Number</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search Value</Label>
              <Input
                placeholder="Enter search term..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" disabled={isBusy || !appliedFilters} onClick={recalcAll} className="w-full">
                {recalcLoading === "ALL" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Recalculate All
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* COLUMN VISIBILITY SETTINGS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Column Visibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(columnVisibility).map(([key, visible]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={visible}
                  onCheckedChange={(checked) =>
                    setColumnVisibility(prev => ({ ...prev, [key]: checked }))
                  }
                />
                <Label htmlFor={key} className="text-sm capitalize">
                  {key === 'pfPerDay' ? 'PF/Day' :
                   key === 'totalHrs' ? 'Total Hrs' :
                   key === 'netSalary' ? 'Net Salary' :
                   key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-[2000px] w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columnVisibility.name && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  )}
                  {columnVisibility.empCode && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Emp Code</th>
                  )}
                  {columnVisibility.mobile && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mobile</th>
                  )}
                  {columnVisibility.pfId && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PF ID</th>
                  )}
                  {columnVisibility.pfPerDay && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PF/Day</th>
                  )}
                  {columnVisibility.esicId && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ESIC ID</th>
                  )}
                  {columnVisibility.aadhaar && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aadhaar</th>
                  )}
                  {columnVisibility.bankAccount && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bank Account</th>
                  )}
                  {columnVisibility.ifscCode && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IFSC</th>
                  )}
                  {columnVisibility.panNumber && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PAN</th>
                  )}
                  {columnVisibility.cycle && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cycle</th>
                  )}
                  {columnVisibility.present && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Present</th>
                  )}
                  {columnVisibility.absent && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Absent</th>
                  )}
                  {columnVisibility.totalHrs && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Hrs</th>
                  )}
                  {columnVisibility.ot && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">OT</th>
                  )}
                  {columnVisibility.rate && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                  )}
                  {columnVisibility.advance && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Advance</th>
                  )}
                  {columnVisibility.deductions && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deductions</th>
                  )}
                  {columnVisibility.netSalary && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Salary</th>
                  )}
                  {columnVisibility.actions && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={Object.values(columnVisibility).filter(Boolean).length} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                        Loading data...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && appliedFilters && (
                  <tr>
                    <td colSpan={Object.values(columnVisibility).filter(Boolean).length} className="px-4 py-8 text-center text-gray-500">
                      No employees found matching the criteria
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map(({ employee, summary }) => {
                    const cycle = getCycleById(employee.cycleTimingId);

                    return (
                      <tr key={`${employee.id}-${summary?.cycleStart || 'no-summary'}`} className="hover:bg-gray-50 transition-colors">
                        {columnVisibility.name && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                        )}
                        {columnVisibility.empCode && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.empCode}</td>
                        )}
                        {columnVisibility.mobile && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.mobile}</td>
                        )}
                        {columnVisibility.pfId && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.pfId || "-"}</td>
                        )}
                        {columnVisibility.pfPerDay && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {employee.pfActive && employee.pfAmountPerDay ? `₹${employee.pfAmountPerDay}` : "-"}
                          </td>
                        )}
                        {columnVisibility.esicId && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.esicId || "-"}</td>
                        )}
                        {columnVisibility.aadhaar && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.aadhaarNumber || "-"}</td>
                        )}
                        {columnVisibility.bankAccount && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.bankAccountNumber || "-"}</td>
                        )}
                        {columnVisibility.ifscCode && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.ifscCode || "-"}</td>
                        )}
                        {columnVisibility.panNumber && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.panNumber || "-"}</td>
                        )}
                        {columnVisibility.cycle && (
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="font-medium">{cycle?.name}</div>
                            {summary && (
                              <div className="text-xs text-gray-500 mt-1">
                                {format(new Date(summary.cycleStart), "dd MMM yyyy")}
                                {" → "}
                                {format(new Date(summary.cycleEnd), "dd MMM yyyy")}
                              </div>
                            )}
                          </td>
                        )}

                        {summary ? (
                          <>
                            {columnVisibility.present && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{summary.daysPresent}</td>
                            )}
                            {columnVisibility.absent && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{summary.daysAbsent}</td>
                            )}
                            {columnVisibility.totalHrs && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{summary.totalHours?.toFixed(2)}</td>
                            )}
                            {columnVisibility.ot && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{summary.overtimeHours?.toFixed(2)}</td>
                            )}
                            {columnVisibility.rate && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₹{summary.hourlyRate}</td>
                            )}
                            {columnVisibility.advance && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₹{summary.advanceAmount}</td>
                            )}
                            {columnVisibility.deductions && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                ₹
                                {Object.values(summary.deductions || {}).reduce(
                                  (a: number, b: any) => a + Number(b || 0),
                                  0
                                )}
                              </td>
                            )}
                            {columnVisibility.netSalary && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">₹{summary.netSalary?.toFixed(2)}</td>
                            )}
                          </>
                        ) : (
                          <td colSpan={[columnVisibility.present, columnVisibility.absent, columnVisibility.totalHrs, columnVisibility.ot, columnVisibility.rate, columnVisibility.advance, columnVisibility.deductions, columnVisibility.netSalary].filter(Boolean).length} className="px-4 py-3 text-center text-sm text-gray-400">
                            Not calculated
                          </td>
                        )}

                        {columnVisibility.actions && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-2">
                              {/* Hidden barcode for download */}
                              <div
                                ref={(el) => (barcodeRefs.current[employee.id] = el)}
                                className="absolute -left-[9999px] top-0 bg-white p-4"
                              >
                                <Barcode
                                  value={employee.empCode}
                                  renderer="canvas"
                                />
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/admin/dashboard/employee/${employee.id}`)}
                                className="px-3 py-1"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isBusy}
                                onClick={() => recalcOne(employee)}
                                className="px-3 py-1"
                              >
                                {recalcLoading === employee.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                ) : (
                                  "Recalc"
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadBarcode(employee.id, employee.empCode)}
                                className="px-3 py-1"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Barcode
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
