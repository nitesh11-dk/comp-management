"use client";

import { Calculator, Filter, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
    employeeCount: number;
    isBusy: boolean;
    showMoreFilters: boolean;
    setShowMoreFilters: (val: boolean) => void;
    showSettings: boolean;
    setShowSettings: (val: boolean) => void;
    onApply: () => void;
}

export function DashboardHeader({
    employeeCount,
    isBusy,
    showMoreFilters,
    setShowMoreFilters,
    showSettings,
    setShowSettings,
    onApply,
}: DashboardHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg shadow-blue-100 shadow-lg shrink-0">
                    <Calculator className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base md:text-xl font-bold text-slate-900 leading-tight truncate">Attendance Dashboard</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 transition-colors cursor-default text-[10px] md:text-xs">
                            {employeeCount} Employees
                        </Badge>
                        {isBusy && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium animate-pulse">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                <span className="hidden sm:inline">Updating...</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMoreFilters(!showMoreFilters)}
                    className={`transition-all duration-200 h-8 px-2 md:px-3 ${showMoreFilters ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'hover:bg-slate-50 active:scale-95'}`}
                >
                    <Filter className={`h-4 w-4 transition-transform duration-200 ${showMoreFilters ? 'rotate-180' : ''}`} />
                    <span className="hidden sm:inline ml-1.5">{showMoreFilters ? "Hide Filters" : "Filters"}</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className={`transition-all active:scale-95 h-8 px-2 md:px-3 ${showSettings ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'hover:bg-slate-50'}`}
                >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1.5">Columns</span>
                </Button>
                <Button
                    variant="default"
                    size="sm"
                    onClick={onApply}
                    disabled={isBusy}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg active:scale-95 transition-all h-8 px-3 md:px-6 font-bold"
                >
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1.5">Apply</span>
                </Button>
            </div>
        </div>
    );
}
