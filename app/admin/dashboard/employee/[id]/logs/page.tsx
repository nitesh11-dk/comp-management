"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getAttendanceWallet } from "@/actions/attendance";
import DayEntriesTable from "@/components/admin/DayEntriesTable";

export default function EmployeeLogsPage() {
    const router = useRouter();
    const params = useParams();
    const search = useSearchParams();

    const employeeId = params.id;
    const dateKey = search.get("date");

    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadEntries = async () => {
        setLoading(true);

        const wallet = await getAttendanceWallet(employeeId);

        if (!wallet || !dateKey) return;

        const filtered = wallet.entries.filter((e: any) =>
            e.timestamp.toISOString().startsWith(dateKey)
        );

        setEntries(filtered);
        setLoading(false);
    };

    useEffect(() => {
        loadEntries();
    }, [employeeId, dateKey]);

    if (!dateKey) return <div className="p-6">No date selected</div>;

    return (
        <div className="p-6 space-y-6">
            <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>

            <h1 className="text-2xl font-bold">Logs for {dateKey}</h1>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <DayEntriesTable
                    entries={entries}
                    employeeId={employeeId}
                    dateKey={dateKey}
                    onDone={loadEntries}
                />
            )}
        </div>
    );
}
