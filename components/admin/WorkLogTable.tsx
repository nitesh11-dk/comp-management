"use client";

import { Card, CardContent } from "@/components/ui/card";
import DayEntriesTable from "./DayEntriesTable";

export default function WorkLogTable({
    workLogs,
    expandedDate,
    dayEntries,
    onExpand,
}: any) {
    const grouped: Record<string, any[]> = {};

    workLogs.forEach((log: any) => {
        const month = log.date.toLocaleString("default", {
            month: "long",
            year: "numeric",
        });

        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(log);
    });

    const sortedMonths = Object.keys(grouped).sort((a, b) => {
        const dA = new Date(grouped[a][0].date);
        const dB = new Date(grouped[b][0].date);
        return dB.getTime() - dA.getTime();
    });

    return (
        <>
            {sortedMonths.map((month, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2">
                    <h2 className="text-xl font-semibold mt-4">{month}</h2>

                    <Card className="w-full max-w-5xl shadow-lg">
                        <CardContent className="overflow-x-auto">
                            <table className="min-w-full border border-gray-300 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border px-4 py-2 text-left">Date</th>
                                        <th className="border px-4 py-2 text-left">Hours</th>
                                        <th className="border px-4 py-2 text-left">Salary</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {grouped[month]
                                        .sort(
                                            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                                        )
                                        .map((log, i) => {
                                            const dateKey = log.date.toISOString().slice(0, 10);
                                            const isExpanded = expandedDate === dateKey;

                                            return (
                                                <>
                                                    <tr
                                                        key={dateKey}
                                                        className="cursor-pointer hover:bg-blue-50"
                                                        onClick={() => onExpand(dateKey)}
                                                    >
                                                        <td className="border px-4 py-2">
                                                            {dateKey}
                                                        </td>
                                                        <td className="border px-4 py-2">
                                                            {log.hours}h {log.minutes}m
                                                        </td>
                                                        <td className="border px-4 py-2">
                                                            ₹{log.salaryEarned}
                                                        </td>
                                                    </tr>

                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={3} className="border bg-gray-50 p-2">
                                                                <DayEntriesTable entries={dayEntries} />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </>
    );
}
