"use client";

export default function DayEntriesTable({ entries }: any) {
    return (
        <table className="w-full text-sm border">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border px-2 py-1">Type</th>
                    <th className="border px-2 py-1">Time</th>
                    <th className="border px-2 py-1">Department</th>
                    <th className="border px-2 py-1">Auto</th>
                </tr>
            </thead>

            <tbody>
                {entries.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="text-center p-2 text-gray-500">
                            No entries found
                        </td>
                    </tr>
                ) : (
                    entries.map((e: any, i: number) => (
                        <tr key={i}>
                            <td className="border px-2 py-1">{e.scanType.toUpperCase()}</td>
                            <td className="border px-2 py-1">
                                {new Date(e.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="border px-2 py-1">
                                {e.department?.name || "Unknown"}
                            </td>
                            <td className="border px-2 py-1">{e.autoClosed ? "Yes" : "No"}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
}
