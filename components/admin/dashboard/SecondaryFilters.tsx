"use client";

import { X, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SecondaryFiltersProps {
    cycles: any[];
    draftCycleId: string;
    setDraftCycleId: (val: string) => void;
    departments: any[];
    draftDeptId: string;
    setDraftDeptId: (val: string) => void;
    shifts: any[];
    draftShiftId: string;
    setDraftShiftId: (val: string) => void;
    isBusy: boolean;
    hiddenFilters: { cycle: boolean; dept: boolean; shift: boolean };
    setHiddenFilters: (val: { cycle: boolean; dept: boolean; shift: boolean }) => void;
}

export function SecondaryFilters({
    cycles,
    draftCycleId,
    setDraftCycleId,
    departments,
    draftDeptId,
    setDraftDeptId,
    shifts,
    draftShiftId,
    setDraftShiftId,
    isBusy,
    hiddenFilters,
    setHiddenFilters,
}: SecondaryFiltersProps) {

    const toggleFilter = (key: "cycle" | "dept" | "shift") => {
        setHiddenFilters({ ...hiddenFilters, [key]: !hiddenFilters[key] });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* CYCLE FILTER */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Cycle Timing</Label>
                    <div className="flex items-center gap-1">
                        {draftCycleId !== "all" && !hiddenFilters.cycle && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDraftCycleId("all")}
                                className="h-4 px-1 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-transparent"
                            >
                                Clear
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFilter("cycle")}
                            className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600 hover:bg-transparent"
                            title={hiddenFilters.cycle ? "Show Cycle filter" : "Hide Cycle filter"}
                        >
                            {hiddenFilters.cycle ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                </div>
                {hiddenFilters.cycle ? (
                    <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400 select-none">
                        Cycle filter hidden
                    </div>
                ) : (
                    <Select disabled={isBusy} value={draftCycleId} onValueChange={setDraftCycleId}>
                        <SelectTrigger className="h-9 bg-white border-slate-200">
                            <SelectValue placeholder="All Cycles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Cycles</SelectItem>
                            {cycles.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* DEPARTMENT FILTER */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Department</Label>
                    <div className="flex items-center gap-1">
                        {draftDeptId !== "all" && !hiddenFilters.dept && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDraftDeptId("all")}
                                className="h-4 px-1 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-transparent"
                            >
                                Clear
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFilter("dept")}
                            className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600 hover:bg-transparent"
                            title={hiddenFilters.dept ? "Show Department filter" : "Hide Department filter"}
                        >
                            {hiddenFilters.dept ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                </div>
                {hiddenFilters.dept ? (
                    <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400 select-none">
                        Department filter hidden
                    </div>
                ) : (
                    <Select disabled={isBusy} value={draftDeptId} onValueChange={setDraftDeptId}>
                        <SelectTrigger className="h-9 bg-white border-slate-200">
                            <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* SHIFT TYPE FILTER */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Shift Type</Label>
                    <div className="flex items-center gap-1">
                        {draftShiftId !== "all" && !hiddenFilters.shift && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDraftShiftId("all")}
                                className="h-4 px-1 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-transparent"
                            >
                                Clear
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFilter("shift")}
                            className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600 hover:bg-transparent"
                            title={hiddenFilters.shift ? "Show Shift filter" : "Hide Shift filter"}
                        >
                            {hiddenFilters.shift ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Button>
                    </div>
                </div>
                {hiddenFilters.shift ? (
                    <div className="h-9 flex items-center px-3 rounded-md border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400 select-none">
                        Shift filter hidden
                    </div>
                ) : (
                    <Select disabled={isBusy} value={draftShiftId} onValueChange={setDraftShiftId}>
                        <SelectTrigger className="h-9 bg-white border-slate-200">
                            <SelectValue placeholder="All Shifts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Shifts</SelectItem>
                            {shifts.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
    );
}
