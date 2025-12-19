"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

interface WorkLogTableProps {
  workLogs: any[];
  employeeId: string;
}

export default function WorkLogTable({ workLogs, employeeId }: WorkLogTableProps) {
  const router = useRouter();

  const { grouped, sortedMonths } = useMemo(() => {
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

    return { grouped, sortedMonths };
  }, [workLogs]);

  if (sortedMonths.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Logs Found</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          This employee doesn't have any attendance records yet. Generate some test data or wait for attendance to be recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card className="w-full shadow-xl border-0 bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                      Working Hours
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                      Salary Earned
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedMonths.map((month) => (
                    <React.Fragment key={month}>
                      <tr className="bg-gray-100">
                        <td colSpan={3} className="px-6 py-4 text-center font-bold text-gray-800">
                          {month}
                        </td>
                      </tr>
                      {grouped[month]
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((log: any, idx: number) => {
                          const dateKey = log.date.toISOString().slice(0, 10);
                          const isEven = idx % 2 === 0;

                          return (
                            <tr
                              key={dateKey}
                              className={`cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:shadow-md ${
                                isEven ? 'bg-gray-50' : 'bg-white'
                              }`}
                              onClick={() =>
                                router.push(
                                  `/admin/dashboard/employee/${employeeId}/logs?date=${dateKey}`
                                )
                              }
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                  {dateKey}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-r border-gray-200">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {log.hours}h {log.minutes}m
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 border-r border-gray-200">
                                ₹{log.salaryEarned.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedMonths.map((month) => (
          <div key={month} className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
              {month}
            </h3>
            <div className="space-y-3">
              {grouped[month]
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((log: any) => {
                  const dateKey = log.date.toISOString().slice(0, 10);

                  return (
                    <Card
                      key={dateKey}
                      className="cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:shadow-md"
                      onClick={() =>
                        router.push(
                          `/admin/dashboard/employee/${employeeId}/logs?date=${dateKey}`
                        )
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{dateKey}</p>
                              <p className="text-xs text-gray-500">
                                {log.hours}h {log.minutes}m worked
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              ₹{log.salaryEarned.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
