"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import { useRef } from "react";
import { Download } from "lucide-react";

export default function EmployeeInfoCard({ employee, department, shiftType, cycleTiming }: any) {
    const barcodeRef = useRef<HTMLDivElement>(null);

    const downloadBarcode = async () => {
        if (!barcodeRef.current) return;

        const canvas = await html2canvas(barcodeRef.current, {
            backgroundColor: "#fff",
            scale: 2,
        });

        const link = document.createElement("a");
        link.download = `employee_${employee.empCode}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    // Format Time → HH:mm
    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toISOString().slice(11, 16);
        } catch {
            return "";
        }
    };

    // Date Format (DOB)
    const formatDate = (d: string) => {
        if (!d) return "N/A";
        return new Date(d).toLocaleDateString("en-IN");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Employee Information</CardTitle>
                </CardHeader>

                <CardContent className="space-y-2 text-sm">

                    {/* BASIC */}
                    <p><strong>Emp Code:</strong> {employee.empCode}</p>
                    <p><strong>Name:</strong> {employee.name}</p>
                    <p><strong>Mobile:</strong> {employee.mobile}</p>
                    <p><strong>Aadhaar:</strong> {employee.aadhaarNumber}</p>
                    <p><strong>PAN:</strong> {employee.panNumber || "N/A"}</p>
                    <p><strong>Date of Birth:</strong> {formatDate(employee.dob)}</p>

                    {/* PF & ESIC */}
                    <p>
                        <strong>PF ID:</strong> {employee.pfId || "N/A"}{" "}
                        <span className={`text-xs ml-2 ${employee.pfActive ? "text-green-600" : "text-red-600"}`}>
                            ({employee.pfActive ? "Active" : "Inactive"})
                        </span>
                    </p>

                    <p>
                        <strong>ESIC ID:</strong> {employee.esicId || "N/A"}{" "}
                        <span className={`text-xs ml-2 ${employee.esicActive ? "text-green-600" : "text-red-600"}`}>
                            ({employee.esicActive ? "Active" : "Inactive"})
                        </span>
                    </p>

                    {/* ADDRESSES */}
                    <p><strong>Current Address:</strong> {employee.currentAddress || "N/A"}</p>
                    <p><strong>Permanent Address:</strong> {employee.permanentAddress || "N/A"}</p>

                    {/* BANK */}
                    <p><strong>Bank A/C:</strong> {employee.bankAccountNumber || "N/A"}</p>
                    <p><strong>IFSC:</strong> {employee.ifscCode || "N/A"}</p>

                    {/* DEPARTMENT */}
                    <p><strong>Department:</strong> {department?.name || "N/A"}</p>

                    {/* SHIFT TYPE */}
                    <p>
                        <strong>Shift:</strong>{" "}
                        {shiftType
                            ? `${shiftType.name} (${formatTime(shiftType.startTime)} - ${formatTime(
                                shiftType.endTime
                            )}, ${shiftType.totalHours} hrs)`
                            : "N/A"}
                    </p>

                    {/* CYCLE TIMING */}
                    <p>
                        <strong>Cycle Timing:</strong>{" "}
                        {cycleTiming
                            ? `${cycleTiming.name} (Starts: ${cycleTiming.startDay}, Days: ${cycleTiming.lengthDays})`
                            : "N/A"}
                    </p>

                    {/* ADVANCE (Json array) */}
                    <div>
                        <strong>Advance Items:</strong>
                        <ul className="list-disc ml-6 mt-1">
                            {Array.isArray(employee.advance) && employee.advance.length > 0 ? (
                                employee.advance.map((item: any, i: number) => (
                                    <li key={i}>
                                        {item.item} — {item.amount ? `₹${item.amount}` : "No default amount"}
                                    </li>
                                ))
                            ) : (
                                <li>No advance items</li>
                            )}
                        </ul>
                    </div>

                    {/* HOURLY RATE */}
                    <p><strong>Hourly Rate:</strong> ₹{employee.hourlyRate}</p>
                </CardContent>
            </Card>

            {/* BARCODE CARD */}
            <Card>
                <CardHeader>
                    <CardTitle>Barcode</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col items-center gap-4">
                    <div ref={barcodeRef} className="p-4 bg-white">
                        <Barcode value={employee.empCode} height={60} fontSize={14} />
                    </div>

                    <Button variant="outline" onClick={downloadBarcode}>
                        <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
