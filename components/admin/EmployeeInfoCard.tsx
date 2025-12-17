"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import { useRef } from "react";
import { Download } from "lucide-react";

export default function EmployeeInfoCard({
  employee,
  department,
  shiftType,
  cycleTiming,
}: any) {
  // ✅ SINGLE REF (correct)
  const barcodeRef = useRef<HTMLDivElement | null>(null);

  // -----------------------------------------
  // Download Barcode (same as AddEmployee)
  // -----------------------------------------
  const downloadBarcode = async () => {
    if (!barcodeRef.current) return;

    // wait for DOM paint
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(barcodeRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `${employee.empCode}_barcode.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toISOString().slice(11, 16);
    } catch {
      return "";
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* LEFT — EMPLOYEE INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 text-sm">
          <p><strong>Employee Code:</strong> {employee.empCode}</p>
          <p><strong>Name:</strong> {employee.name}</p>
          <p><strong>Mobile:</strong> {employee.mobile}</p>
          <p><strong>Aadhaar:</strong> {employee.aadhaarNumber}</p>
          <p><strong>PAN:</strong> {employee.panNumber || "N/A"}</p>
          <p><strong>Date of Birth:</strong> {formatDate(employee.dob)}</p>

          <p>
            <strong>PF ID:</strong> {employee.pfId || "N/A"}{" "}
            <span
              className={`text-xs ml-2 ${
                employee.pfActive ? "text-green-600" : "text-red-600"
              }`}
            >
              ({employee.pfActive ? "Active" : "Inactive"})
            </span>
          </p>

          <p>
            <strong>ESIC ID:</strong> {employee.esicId || "N/A"}{" "}
            <span
              className={`text-xs ml-2 ${
                employee.esicActive ? "text-green-600" : "text-red-600"
              }`}
            >
              ({employee.esicActive ? "Active" : "Inactive"})
            </span>
          </p>

          <p><strong>Current Address:</strong> {employee.currentAddress || "N/A"}</p>
          <p><strong>Permanent Address:</strong> {employee.permanentAddress || "N/A"}</p>

          <p><strong>Department:</strong> {department?.name || "N/A"}</p>

          <p>
            <strong>Shift:</strong>{" "}
            {shiftType
              ? `${shiftType.name} (${formatTime(
                  shiftType.startTime
                )} - ${formatTime(shiftType.endTime)}, ${
                  shiftType.totalHours
                } hrs)`
              : "N/A"}
          </p>

          <p>
            <strong>Cycle Timing:</strong>{" "}
            {cycleTiming
              ? `${cycleTiming.name} (Starts: ${cycleTiming.startDay}, Days: ${cycleTiming.lengthDays})`
              : "N/A"}
          </p>

          <p><strong>Hourly Rate:</strong> ₹{employee.hourlyRate}</p>
        </CardContent>
      </Card>

      {/* RIGHT — BANK + BARCODE */}
      <Card>
        <CardHeader>
          <CardTitle>Bank & Salary Info</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <p><strong>Bank Account Number:</strong> {employee.bankAccountNumber || "N/A"}</p>
          <p><strong>IFSC Code:</strong> {employee.ifscCode || "N/A"}</p>

          {/* 🔥 OFFSCREEN BARCODE (NOT hidden) */}
          <div
            ref={barcodeRef}
            className="absolute -left-[9999px] top-0 bg-white p-4"
          >
            <Barcode
              value={employee.empCode}
              renderer="canvas"   // 🔥 MUST
              height={70}
              fontSize={14}
            />
          </div>

          {/* DOWNLOAD BUTTON */}
          <Button size="sm" variant="outline" onClick={downloadBarcode}>
            <Download className="h-3 w-3 mr-1" />
            Download Barcode
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
