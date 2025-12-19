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
     FILTERS
  ============================ */
  const [draftMonth, setDraftMonth] = useState(now.getMonth() + 1);
  const [draftYear, setDraftYear] = useState(now.getFullYear());
  const [draftCycleId, setDraftCycleId] = useState<string>("all");

  const [appliedFilters, setAppliedFilters] = useState<{
    month: number;
    year: number;
    cycleId: string;
  } | null>(null);

  /* ============================
     LOADING
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

  const getCycleById = (id: string) =>
    cycles.find((c) => c.id === id);

  /* ============================
     LOAD CYCLES
  ============================ */
  useEffect(() => {
    (async () => {
      const res = await getCycleTimings();
      if (res.success) {
        setCycles(res.data || []);
        setDraftCycleId("all");
      }
    })();
  }, []);

  /* ============================
     SEARCH
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

      if (reqId === requestIdRef.current) setRows(result);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!appliedFilters || cycles.length === 0) return;
    loadDashboard(
      appliedFilters.month,
      appliedFilters.year,
      appliedFilters.cycleId
    );
  }, [appliedFilters]);

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

      await loadDashboard(month, year, cycleId);
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
      <h2 className="text-xl font-bold">Monthly Attendance Dashboard</h2>

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
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <Button disabled={isBusy} onClick={onSearch} className="px-4 py-2">Search</Button>
        <Button variant="outline" disabled={isBusy || !appliedFilters} onClick={recalcAll} className="px-4 py-2">
          {recalcLoading === "ALL" ? "Calculating..." : "Recalculate All"}
        </Button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-[1600px] w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PF ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PF/Day</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cycle</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Present</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Absent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Hrs</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">OT</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Advance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deductions</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Net Salary</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2"></div>
                    Loading data...
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              rows.map(({ employee, summary }) => {
                const cycle = getCycleById(employee.cycleTimingId);

                return (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{employee.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{employee.pfId || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {employee.pfActive && employee.pfAmountPerDay ? `₹${employee.pfAmountPerDay}` : "-"}
                    </td>

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

                    {summary ? (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{summary.daysPresent}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{summary.daysAbsent}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{summary.totalHours}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{summary.overtimeHours}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₹{summary.hourlyRate}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">₹{summary.advanceAmount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          ₹
                          {Object.values(summary.deductions || {}).reduce(
                            (a: number, b: any) => a + Number(b || 0),
                            0
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">₹{summary.netSalary}</td>
                      </>
                    ) : (
                      <td colSpan={9} className="px-4 py-3 text-center text-sm text-gray-400">
                        Not calculated
                      </td>
                    )}

                    <td className="px-4 py-3 whitespace-nowrap">
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
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
