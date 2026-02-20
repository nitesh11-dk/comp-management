"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSupervisorScans, SupervisorScanLog } from "@/actions/supervisiorhistory";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SupervisorHistoryPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<SupervisorScanLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    // Default to today's date
    const todayStr = useMemo(() => {
        const d = new Date();
        return d.toISOString().slice(0, 10);
    }, []);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [scanType, setScanType] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const data = await getSupervisorScans();
                setLogs(data);
            } catch (err: any) {
                console.error("Error fetching supervisor scan logs:", err);
                setError(err?.message || "Failed to fetch supervisor scan logs.");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    // Filtered logs
    const filteredLogs = useMemo(() => {
        return logs
            .filter(log => {
                // Date filter
                if (selectedDate) {
                    const filterDate = new Date(selectedDate).toDateString();
                    const logDate = new Date(log.timestamp).toDateString();
                    if (filterDate !== logDate) return false;
                }
                // Scan type filter
                if (scanType && log.scanType !== scanType) return false;
                // Name/code search
                if (search) {
                    const s = search.trim().toLowerCase();
                    if (!log.employeeName.toLowerCase().includes(s) && !(log.employeeCode?.toLowerCase().includes(s))) {
                        return false;
                    }
                }
                return true;
            })
            .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    }, [logs, selectedDate, search, scanType]);

    if (loading)
        return (
            <div className="text-center py-10 text-gray-500">
                Loading supervisor scan history...
            </div>
        );

    if (error)
        return (
            <div className="text-center py-10 text-red-500">
                {error}
            </div>
        );

    return (
        <div className="space-y-4 p-1 sm:px-4">
            {/* Back Button */}
            <div className="flex justify-start">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                </Button>
            </div>

            {/* Page Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">
                Supervisor Scan History
            </h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center mb-2">
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="max-w-xs"
                />
                <Input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or code"
                    className="max-w-xs"
                />
                <select
                    value={scanType}
                    onChange={e => setScanType(e.target.value)}
                    className="max-w-xs border rounded px-2 py-2 text-sm"
                >
                    <option value="">All Types</option>
                    <option value="in">IN</option>
                    <option value="out">OUT</option>
                </select>
            </div>

            {/* Table */}
            <Card className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm sm:text-base">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-2 sm:px-4 py-2 border text-left">Employee Name</th>
                            <th className="px-2 sm:px-4 py-2 border text-left">Emp Code</th>
                            <th className="px-2 sm:px-4 py-2 border text-left">Department</th>
                            <th className="px-2 sm:px-4 py-2 border text-left">Scan Type</th>
                            <th className="px-2 sm:px-4 py-2 border text-left">Time</th>
                            <th className="px-2 sm:px-4 py-2 border text-left">Auto Closed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center px-2 sm:px-4 py-2">
                                    No scans recorded yet.
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log, index) => (
                                <tr key={index} className={`hover:bg-gray-50 ${log.isCrossDepartment ? 'bg-red-50' : ''}`} style={{ position: 'relative' }}>
                                   
                                    <td className="px-2 sm:px-4 py-2 border font-medium">
                                         {/* Red dot absolutely positioned top-left for cross dept */}
                                    {log.isCrossDepartment && (
                                        <span style={{ position: 'absolute', left: 8, top: 8, width: 4, height: 4, borderRadius: '50%', background: '#dc2626', display: 'inline-block', zIndex: 2 }}></span>
                                    )}{log.employeeName}</td>
                                    <td className="px-2 sm:px-4 py-2 border font-mono font-semibold">{log.employeeCode}</td>
                                    <td className="px-2 sm:px-4 py-2 border">{log.departmentName}</td>
                                    <td className="px-2 sm:px-4 py-2 border">{log.scanType.toUpperCase()}</td>
                                    <td className="px-2 sm:px-4 py-2 border">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                                    <td className="px-2 sm:px-4 py-2 border">{log.autoClosed ? "Yes" : "No"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
