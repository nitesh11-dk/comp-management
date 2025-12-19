"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupervisorScans, SupervisorScanLog } from "@/actions/supervisiorhistory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SupervisorHistoryPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<SupervisorScanLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

            {/* Table */}
            <Card className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm sm:text-base">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-2 sm:px-4 py-2 border text-left">Employee Name</th>
                            <th className="px-2 sm:px-4 py-2 border text-left">Department</th>
                            <th className="px-2 sm:px-4 py-2 border text-left">Scan Type</th>
                            <th className="px-2 sm:px-4 py-2 border text-left">Timestamp</th>
                            <th className="px-2 sm:px-4 py-2 border text-left">Auto Closed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center px-2 sm:px-4 py-2">
                                    No scans recorded yet.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-2 sm:px-4 py-2 border">{log.employeeName}</td>
                                    <td className="px-2 sm:px-4 py-2 border">{log.departmentName}</td>
                                    <td className="px-2 sm:px-4 py-2 border">{log.scanType.toUpperCase()}</td>
                                    <td className="px-2 sm:px-4 py-2 border">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
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
