"use client";

import { useEffect, useRef, useState } from "react";
import { getEmployees } from "@/actions/employeeActions";
import { getDepartments } from "@/actions/department";
import { getCycleTimings } from "@/actions/cycleTimings";
import {
  getEmployeesWithMonthlySummary,
  calculateMonthlyForAllEmployees,
  calculateMonthlyForEmployee,
} from "@/actions/monthlyAttendance";
import { getGlobalSettings, updateGlobalSettings } from "@/actions/userSettings";
import { getShiftTypes } from "@/actions/shiftTypes";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Download, Eye, Edit, Calculator, Filter, Settings, Search, ChevronDown, ChevronUp } from "lucide-react";
import Barcode from "react-barcode";

import html2canvas from "html2canvas";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useDataCache } from "@/components/providers/DataProvider";

import { DashboardHeader } from "./dashboard/DashboardHeader";
import { FilterBar } from "./dashboard/FilterBar";
import { SecondaryFilters } from "./dashboard/SecondaryFilters";
import { DisplaySettings } from "./dashboard/DisplaySettings";
import { EmployeeTable } from "./dashboard/EmployeeTable";

export type Row = {
  employee: any;
  summary: any | null;
};
const now = new Date();

export function CombinedEmployeeDashboard() {
  const requestIdRef = useRef(0);
  const barcodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const router = useRouter();
  const { getCachedData, setCachedData, masterDataCache, clearCache } = useDataCache();

  /* ============================
     MASTER DATA
  ============================ */
  const [employees, setEmployees] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  /* ============================
     FILTERS
  ============================ */
  const [draftMonth, setDraftMonth] = useState(now.getMonth() + 1);
  const [draftYear, setDraftYear] = useState(now.getFullYear());
  const [draftCycleId, setDraftCycleId] = useState<string>("all");
  const [draftDeptId, setDraftDeptId] = useState<string>("all");
  const [draftShiftId, setDraftShiftId] = useState<string>("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [hiddenFilters, setHiddenFilters] = useState({ cycle: false, dept: false, shift: false });

  // Employee search filters
  const [searchField, setSearchField] = useState("name");
  const [searchValue, setSearchValue] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<{
    month: number;
    year: number;
    cycleId: string;
    departmentId: string;
    shiftTypeId: string;
    searchField: string;
    searchValue: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();

  /* ============================
     URL SYNC
  ============================ */
  useEffect(() => {
    // Initial sync from URL search params
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : now.getMonth() + 1;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : now.getFullYear();
    const cycleId = searchParams.get("cycleId") || "all";
    const departmentId = searchParams.get("departmentId") || "all";
    const shiftTypeId = searchParams.get("shiftTypeId") || "all";
    const sField = searchParams.get("sField") || "name";
    const sValue = searchParams.get("sValue") || "";

    setDraftMonth(month);
    setDraftYear(year);
    setDraftCycleId(cycleId);
    setDraftDeptId(departmentId);
    setDraftShiftId(shiftTypeId);
    setSearchField(sField);
    setSearchValue(sValue);

    setAppliedFilters({
      month,
      year,
      cycleId,
      departmentId,
      shiftTypeId,
      searchField: sField,
      searchValue: sValue,
    });

    if (cycleId !== "all" || departmentId !== "all" || shiftTypeId !== "all" || sValue !== "") {
      setShowMoreFilters(true);
    }
  }, [searchParams]);

  /* ============================
     COLUMN VISIBILITY
  ============================ */
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    empCode: false,
    mobile: false,
    pfId: true,
    pfPerDay: true,
    esicId: false,
    aadhaar: false,
    bankAccount: false,
    ifscCode: false,
    panNumber: false,
    cycle: true,
    present: true,
    absent: true,
    totalHrs: true,
    ot: true,
    rate: true,
    joinedAt: false,
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
      // Check Master Data Cache
      if (masterDataCache.current.employees) {
        setEmployees(masterDataCache.current.employees);
        setDepartments(masterDataCache.current.departments);
        setShifts(masterDataCache.current.shifts);
        setCycles(masterDataCache.current.cycles);
        setInitialLoading(false);
        return;
      }

      try {
        const [empRes, depRes, cycleRes, shiftRes] = await Promise.all([
          getEmployees(),
          getDepartments(),
          getCycleTimings(),
          getShiftTypes(),
        ]);

        if (empRes.success) {
          setEmployees(empRes.data || []);
          masterDataCache.current.employees = empRes.data || [];
        }
        if (depRes.success) {
          setDepartments(depRes.data || []);
          masterDataCache.current.departments = depRes.data || [];
        }
        if (shiftRes.success) {
          setShifts(shiftRes.data || []);
          masterDataCache.current.shifts = shiftRes.data || [];
        }
        if (cycleRes.success) {
          setCycles(cycleRes.data || []);
          masterDataCache.current.cycles = cycleRes.data || [];
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
     GLOBAL UI SETTINGS
  ============================ */
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      const res = await getGlobalSettings();
      if (res.success && res.data && res.data.columnVisibility) {
        setColumnVisibility((prev) => ({
          ...prev,
          ...res.data.columnVisibility,
        }));
      }
    };
    fetchGlobalSettings();
  }, []);

  const saveAsDefaults = async () => {
    setSavingSettings(true);
    try {
      const res = await updateGlobalSettings(columnVisibility);
      if (res.success) {
        toast.success("Global column visibility updated successfully!");
      }
    } catch (err) {
      console.error("Failed to save defaults:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  /* ============================
     SEARCH & FILTER
  ================================ */
  const onSearch = () => {
    if (!draftMonth || !draftYear) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("month", draftMonth.toString());
    params.set("year", draftYear.toString());
    params.set("cycleId", draftCycleId);
    params.set("departmentId", draftDeptId);
    params.set("shiftTypeId", draftShiftId);
    params.set("sField", searchField);
    params.set("sValue", searchValue);

    // Clear the specific dashboard cache for these filters to force fresh fetch
    const cacheKey = `dash_${draftYear}_${draftMonth}_${draftCycleId}_${draftDeptId}_${draftShiftId}`;
    clearCache(cacheKey);

    router.replace(`${pathname}?${params.toString()}`);
  };

  /* ============================
     LOAD DASHBOARD
  ================================ */
  const loadDashboard = async (
    month: number,
    year: number,
    cycleId: string,
    departmentId: string,
    shiftTypeId: string,
    searchField: string,
    searchValue: string
  ) => {
    const cacheKey = `dash_${year}_${month}_${cycleId}_${departmentId}_${shiftTypeId}`;
    const cached = getCachedData<Row[]>(cacheKey);

    if (cached) {
      // Still apply search filter on cached data
      let finalRows = cached;
      if (searchValue.trim()) {
        const lower = searchValue.toLowerCase().trim();
        finalRows = finalRows.filter((r) => {
          if (searchField === "name") return r.employee.name.toLowerCase().includes(lower);
          if (searchField === "empCode") return r.employee.empCode.toLowerCase().includes(lower);
          return true;
        });
      }
      setRows(finalRows);
      return;
    }

    const reqId = ++requestIdRef.current;
    setLoading(true);

    try {
      const resultRows = await getEmployeesWithMonthlySummary({
        year,
        month,
        cycleTimingId: cycleId,
        departmentId,
        shiftTypeId,
        searchField,
        searchValue,
      });

      if (reqId !== requestIdRef.current) return;

      const fullRows = resultRows as Row[];
      setCachedData(cacheKey, fullRows);

      let finalRows = fullRows;
      if (searchValue.trim()) {
        const lower = searchValue.toLowerCase().trim();
        finalRows = finalRows.filter((r) => {
          if (searchField === "name") return r.employee.name.toLowerCase().includes(lower);
          if (searchField === "empCode") return r.employee.empCode.toLowerCase().includes(lower);
          return true;
        });
      }

      setRows(finalRows);
    } catch (err: any) {
      console.error("Dashboard Load Error:", err);
      toast.error(err.message || "Failed to load dashboard data");
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!appliedFilters || cycles.length === 0 || initialLoading) return;
    loadDashboard(
      appliedFilters.month,
      appliedFilters.year,
      appliedFilters.cycleId,
      appliedFilters.departmentId,
      appliedFilters.shiftTypeId,
      appliedFilters.searchField,
      appliedFilters.searchValue
    );
  }, [appliedFilters, initialLoading, cycles.length]);

  /* ============================
     RECALC
  ============================ */
  const updateLocalRow = (employeeId: string, updatedSummary: any) => {
    setRows((prev) =>
      prev.map((row) =>
        row.employee.id === employeeId ? { ...row, summary: updatedSummary } : row
      )
    );
  };

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

      clearCache("dash_", true);

      await loadDashboard(
        month,
        year,
        cycleId,
        appliedFilters.departmentId,
        appliedFilters.shiftTypeId,
        appliedFilters.searchField,
        appliedFilters.searchValue
      );
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

      const res = await calculateMonthlyForEmployee({
        employeeId: employee.id,
        year: appliedFilters.year,
        month: appliedFilters.month,
        cycleTimingId: cycleToUse,
      });

      if (res.success && res.data) {
        updateLocalRow(employee.id, res.data);
        clearCache("dash_", true);
        toast.success(`Recalculated for ${employee.name}`);
      }
    } catch (err: any) {
      console.error("Recalc Error:", err);
      toast.error(err.message || "Failed to recalculate");
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
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-500">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <Calculator className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400 opacity-50" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-semibold text-slate-700">Loading Dashboard</span>
          <span className="text-sm text-slate-400">Fetching employees and master data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-full bg-slate-50/50">
      {/* 🔹 STICKY TOP FILTER BAR */}
      <div className="sticky top-0 z-20 w-full max-w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 py-3 md:px-6">
        <div className="max-w-[1600px] mx-auto space-y-3">
          <DashboardHeader
            employeeCount={rows.length}
            isBusy={isBusy}
            showMoreFilters={showMoreFilters}
            setShowMoreFilters={setShowMoreFilters}
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            onApply={onSearch}
          />

          <FilterBar
            draftMonth={draftMonth}
            setDraftMonth={setDraftMonth}
            draftYear={draftYear}
            setDraftYear={setDraftYear}
            searchField={searchField}
            setSearchField={setSearchField}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            onSearch={onSearch}
            isBusy={isBusy}
          />

          {showMoreFilters && (
            <SecondaryFilters
              cycles={cycles}
              draftCycleId={draftCycleId}
              setDraftCycleId={setDraftCycleId}
              departments={departments}
              draftDeptId={draftDeptId}
              setDraftDeptId={setDraftDeptId}
              shifts={shifts}
              draftShiftId={draftShiftId}
              setDraftShiftId={setDraftShiftId}
              isBusy={isBusy}
              hiddenFilters={hiddenFilters}
              setHiddenFilters={setHiddenFilters}
            />
          )}
        </div>
      </div>

      <div className="flex-1 w-full max-w-full overflow-x-auto overflow-y-auto p-3 md:p-6 lg:p-8">
        <div className="w-full max-w-[1600px] min-w-0 mx-auto space-y-6">
          {showSettings && (
            <DisplaySettings
              columnVisibility={columnVisibility}
              setColumnVisibility={setColumnVisibility}
              setShowSettings={setShowSettings}
              saveAsDefaults={saveAsDefaults}
              savingSettings={savingSettings}
            />
          )}

          <EmployeeTable
            rows={rows}
            columnVisibility={columnVisibility}
            loading={loading}
            recalcLoading={recalcLoading}
            onRecalc={recalcOne}
            onDownloadBarcode={downloadBarcode}
            barcodeRefs={barcodeRefs}
            isBusy={isBusy}
            cycles={cycles}
          />
        </div>
      </div>
    </div>
  );
}
