"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCycleTimings } from "@/actions/cycleTimings";
import {
  getMonthlySummaries,
  calculateMonthlyForAllEmployees,
  calculateMonthlyForEmployee,
} from "@/actions/monthlyAttendance";
import { format } from "date-fns";

type Row = {
  employee: any;
  summary: any | null;
};

export default function AdminAttendanceDashboardV2() {
  const now = new Date();
  const requestIdRef = useRef(0);

  /* ============================
     MASTER DATA
  ============================ */
  const [cycles, setCycles] = useState<any[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  /* ============================
     DRAFT FILTERS (UI)
  ============================ */
  const [draftMonth, setDraftMonth] = useState(now.getMonth() + 1);
  const [draftYear, setDraftYear] = useState(now.getFullYear());
  const [draftCycleId, setDraftCycleId] = useState<string>("all");

  /* ============================
     APPLIED FILTERS
  ============================ */
  const [appliedFilters, setAppliedFilters] = useState<{
    month: number;
    year: number;
    cycleId: string;
  } | null>(null);

  /* ============================
     LOADING STATES
  ============================ */
  const [loading, setLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState<string | null>(null);

  const isBusy = loading || recalcLoading !== null;

  /* ============================
     HELPERS
  ============================ */
  const getMonthEnd = (y: number, m: number) => {
    const d = new Date(y, m, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  /* ============================
     LOAD CYCLES ONCE
  ============================ */
  useEffect(() => {
    (async () => {
      const res = await getCycleTimings();
      if (res.success) {
        setCycles(res.data);
        setDraftCycleId("all");
      }
    })();
  }, []);

  /* ============================
     SEARCH CLICK
  ============================ */
  const onSearch = () => {
    if (!draftMonth || !draftYear || !draftCycleId) return;

    setAppliedFilters({
      month: draftMonth,
      year: draftYear,
      cycleId: draftCycleId,
    });
  };

  /* ============================
     LOAD DASHBOARD
  ============================ */
  const loadDashboard = async (
    month: number,
    year: number,
    cycleId: string
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

        // ✅ FIX: joinedAt (NOT createdAt)
        result = flat.filter((r) => {
          const joined = new Date(r.employee.joinedAt);
          return joined <= monthEnd;
        });

        // dedupe
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

        result = data.filter((r) => {
          const joined = new Date(r.employee.joinedAt);
          return joined <= monthEnd;
        });
      }

      if (reqId !== requestIdRef.current) return;
      setRows(result);
    } catch (err) {
      console.error(err);
      if (reqId === requestIdRef.current) setRows([]);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  };

  /* ============================
     LOAD AFTER SEARCH
  ============================ */
  useEffect(() => {
    if (!appliedFilters || cycles.length === 0) return;

    loadDashboard(
      appliedFilters.month,
      appliedFilters.year,
      appliedFilters.cycleId
    );
  }, [appliedFilters]);

  /* ============================
     RECALCULATE ALL
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

      await loadDashboard(month, year, cycleId);
    } finally {
      setRecalcLoading(null);
    }
  };

  /* ============================
     RECALCULATE ONE
  ============================ */
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
        appliedFilters.cycleId
      );
    } finally {
      setRecalcLoading(null);
    }
  };

  /* ============================
     RENDER
  ============================ */
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Monthly Attendance Dashboard (V2)</h2>

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-2 items-center">
        <select disabled={isBusy} value={draftMonth} onChange={(e) => setDraftMonth(+e.target.value)}>
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i + 1}>
              {format(new Date(2024, i, 1), "MMMM")}
            </option>
          ))}
        </select>

        <select disabled={isBusy} value={draftYear} onChange={(e) => setDraftYear(+e.target.value)}>
          {[draftYear - 1, draftYear, draftYear + 1].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        <select disabled={isBusy} value={draftCycleId} onChange={(e) => setDraftCycleId(e.target.value)}>
          <option value="all">All Cycles</option>
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <Button disabled={isBusy} onClick={onSearch}>
          🔍 Search
        </Button>

        <Button variant="destructive" disabled={isBusy || !appliedFilters} onClick={recalcAll}>
          {recalcLoading === "ALL" ? "Calculating..." : "🔄 Recalculate All"}
        </Button>
      </div>

      {/* TABLE */}
      <div className="overflow-auto border rounded">
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th>Name</th>
              <th>Aadhaar</th>
              <th>PF</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Total</th>
              <th>OT</th>
              <th>Rate</th>
              <th>Gross</th>
              <th>PF</th>
              <th>Advance</th>
              <th>Deductions</th>
              <th>Net</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={14} className="text-center p-6">Loading data...</td>
              </tr>
            )}

            {!loading &&
              rows.map(({ employee, summary }) => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.aadhaarNumber}</td>
                  <td>{employee.pfId || "-"}</td>

                  {summary ? (
                    <>
                      <td>{summary.daysPresent}</td>
                      <td>{summary.daysAbsent}</td>
                      <td>{summary.totalHours}</td>
                      <td>{summary.overtimeHours}</td>
                      <td>₹{summary.hourlyRate}</td>
                      <td>₹{summary.grossSalary}</td>
                      <td>₹{summary.pfAmount}</td>
                      <td>₹{summary.advanceAmount}</td>
                      <td>₹{summary.deductions ? Object.values(summary.deductions).reduce((a:any,b:any)=>a+b,0) : 0}</td>
                      <td className="font-semibold">₹{summary.netSalary}</td>
                    </>
                  ) : (
                    <td colSpan={9} className="text-center text-gray-400">
                      Not calculated
                    </td>
                  )}

                  <td>
                    <Button size="sm" disabled={isBusy} onClick={() => recalcOne(employee)}>
                      🔄
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
