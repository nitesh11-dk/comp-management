"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import { useRef } from "react";
import { Download } from "lucide-react";

export default function EmployeeInfoCard({ employee, department, shiftType }: any) {
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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Employee Info</CardTitle>
                </CardHeader>

                <CardContent className="space-y-2">
                    <p><strong>EmpCode:</strong> {employee.empCode}</p>
                    <p><strong>Name:</strong> {employee.name}</p>
                    <p><strong>Mobile:</strong> {employee.mobile}</p>
                    <p><strong>Aadhaar:</strong> {employee.aadhaarNumber}</p>
                    <p><strong>PF ID:</strong> {employee.pfId || "N/A"}</p>
                    <p><strong>ESIC ID:</strong> {employee.esicId || "N/A"}</p>

                    <p><strong>Department:</strong> {department?.name || "N/A"}</p>

                    {/* ✅ Proper Shift Type Display */}
                    <p>
                        <strong>Shift Type:</strong>{" "}
                        {shiftType?.name
                            ? `${shiftType.name} (${formatTime(shiftType.startTime)} - ${formatTime(
                                shiftType.endTime
                            )}, ${shiftType.totalHours} hrs)`
                            : "N/A"}
                    </p>

                    <p><strong>Hourly Rate:</strong> ₹{employee.hourlyRate}</p>
                </CardContent>
            </Card>

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
