"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeRow } from "./EmployeeRow";

interface Row {
  employee: any;
  summary: any | null;
}

interface EmployeeTableProps {
  rows: Row[];
  columnVisibility: any;
  loading: boolean;
  recalcLoading: string | null;
  onRecalc: (emp: any) => void;
  onDownloadBarcode: (id: string, code: string) => void;
  barcodeRefs: any;
  isBusy: boolean;
  cycles: any[];
}

export function EmployeeTable({
  rows,
  columnVisibility,
  loading,
  recalcLoading,
  onRecalc,
  onDownloadBarcode,
  barcodeRefs,
  isBusy,
  cycles,
}: EmployeeTableProps) {
  /* ============================
     TABLE SCROLLING (DRAG TO SCROLL)
  ============================ */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const getCycleById = (id: string) => cycles.find((c) => c.id === id);

  return (
    <Card className="w-full max-w-full border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-200">
      <CardContent className="p-0">
        <div
          ref={scrollRef}
          className="relative w-full overflow-auto max-h-[calc(100vh-260px)] md:max-h-[calc(100vh-280px)] cursor-grab active:cursor-grabbing select-none scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent touch-pan-x"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <table className="min-w-full w-max table-fixed text-sm border-separate border-spacing-0">
            {/* HEADER ONLY STICKY ON TOP */}
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b border-slate-200">
                {columnVisibility.name && (
                  <th className="bg-slate-50 w-[150px] md:w-[180px] px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    Name
                  </th>
                )}

                {columnVisibility.empCode && (
                  <th className="w-[120px] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap border-r border-slate-200">
                    Emp Code
                  </th>
                )}

                {columnVisibility.mobile && (
                  <th className="w-[120px] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap border-r border-slate-200">
                    Mobile
                  </th>
                )}

                {columnVisibility.pfId && (
                  <th className="w-[130px] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap border-r border-slate-200">
                    PF ID
                  </th>
                )}

                {columnVisibility.pfPerDay && (
                  <th className="w-[90px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    PF/Day
                  </th>
                )}

                {columnVisibility.esicId && (
                  <th className="w-[130px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    ESIC ID
                  </th>
                )}

                {columnVisibility.aadhaar && (
                  <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    Aadhaar
                  </th>
                )}

                {columnVisibility.bankAccount && (
                  <th className="w-[160px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    Bank Account
                  </th>
                )}

                {columnVisibility.ifscCode && (
                  <th className="w-[110px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    IFSC
                  </th>
                )}

                {columnVisibility.panNumber && (
                  <th className="w-[120px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    PAN
                  </th>
                )}

                {columnVisibility.rate && (
                  <th className="w-[90px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    Rate
                  </th>
                )}

                {columnVisibility.joinedAt && (
                  <th className="w-[110px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    Joined At
                  </th>
                )}

                {columnVisibility.cycle && (
                  <th className="w-[200px] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap border-r border-slate-200">
                    Cycle
                  </th>
                )}

                {columnVisibility.present && (
                  <th className="w-[80px] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap border-r border-slate-200">
                    Present
                  </th>
                )}

                {columnVisibility.absent && (
                  <th className="w-[80px] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap border-r border-slate-200">
                    Absent
                  </th>
                )}

                {columnVisibility.totalHrs && (
                  <th className="w-[90px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    Total Hrs
                  </th>
                )}

                {columnVisibility.ot && (
                  <th className="w-[70px] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap border-r border-slate-200">
                    OT
                  </th>
                )}

                {columnVisibility.advance && (
                  <th className="w-[100px] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap border-r border-slate-200">
                    Advance
                  </th>
                )}

                {columnVisibility.deductions && (
                  <th className="w-[110px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    Deductions
                  </th>
                )}

                {columnVisibility.netSalary && (
                  <th className="w-[130px] px-4 py-3 text-left text-xs font-semibold text-slate-900 uppercase whitespace-nowrap border-r border-slate-200">
                    Net Salary
                  </th>
                )}

                {columnVisibility.actions && (
                  <th className="w-[220px] px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase whitespace-nowrap">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {!loading &&
                rows.map(({ employee, summary }) => {
                  const cycle = getCycleById(employee.cycleTimingId);
                  return (
                    <EmployeeRow
                      key={`${employee.id}-${summary?.cycleStart || "no-summary"}`}
                      employee={employee}
                      summary={summary}
                      columnVisibility={columnVisibility}
                      recalcLoading={recalcLoading}
                      isBusy={isBusy}
                      onRecalc={onRecalc}
                      onDownloadBarcode={onDownloadBarcode}
                      barcodeRef={(el) => {
                        barcodeRefs.current[employee.id] = el;
                      }}
                      cycleName={cycle?.name}
                    />
                  );
                })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}