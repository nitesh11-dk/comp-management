"use client";

import { Search } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FilterBarProps {
    draftMonth: number;
    setDraftMonth: (val: number) => void;
    draftYear: number;
    setDraftYear: (val: number) => void;
    searchField: string;
    setSearchField: (val: string) => void;
    searchValue: string;
    setSearchValue: (val: string) => void;
    onSearch: () => void;
    isBusy: boolean;
}

export function FilterBar({
    draftMonth,
    setDraftMonth,
    draftYear,
    setDraftYear,
    searchField,
    setSearchField,
    searchValue,
    setSearchValue,
    onSearch,
    isBusy,
}: FilterBarProps) {
    const years = Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => 2020 + i);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3 pt-1">
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight ml-1">Month</Label>
                <Select disabled={isBusy} value={draftMonth.toString()} onValueChange={(value) => setDraftMonth(parseInt(value))}>
                    <SelectTrigger className="h-9 bg-white border-slate-200 hover:border-slate-300 focus:ring-blue-500 transition-colors text-xs md:text-sm">
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

            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight ml-1">Year</Label>
                <Select disabled={isBusy} value={draftYear.toString()} onValueChange={(value) => setDraftYear(parseInt(value))}>
                    <SelectTrigger className="h-9 bg-white border-slate-200 hover:border-slate-300 focus:ring-indigo-500 transition-colors text-xs md:text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="col-span-2 md:col-span-2 lg:col-span-4 space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-tight ml-1">Search Employee</Label>
                <div className="flex gap-2">
                    <Select value={searchField} onValueChange={setSearchField}>
                        <SelectTrigger className="h-9 w-[90px] md:w-[110px] bg-white border-slate-200 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="empCode">Emp Code</SelectItem>
                            <SelectItem value="pfId">PF ID</SelectItem>
                            <SelectItem value="esicId">ESIC ID</SelectItem>
                            <SelectItem value="aadhaar">Aadhaar</SelectItem>
                            <SelectItem value="mobile">Mobile</SelectItem>
                            <SelectItem value="bankAccount">Bank Acc</SelectItem>
                            <SelectItem value="ifscCode">IFSC</SelectItem>
                            <SelectItem value="panNumber">PAN</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            className="h-9 pl-9 bg-white border-slate-200 focus:ring-blue-500 text-sm"
                            placeholder={`Search...`}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onSearch()}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

