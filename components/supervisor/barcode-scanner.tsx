"use client";

import { useState } from "react";
import { ScanResult } from "@/actions/attendance";
import BarcodeScanner from "@/components/BarCode";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock } from "lucide-react";

type Props = {
  scanEmployee: (empCode: string) => Promise<ScanResult>;
};

export default function SupervisorBarcodeScanner({ scanEmployee }: Props) {
  const [lastScannedEmployee, setLastScannedEmployee] =
    useState<ScanResult | null>(null);
  const [scanTime, setScanTime] = useState<Date | null>(null);

  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const [scannerOpenTriggerCount, setScannerOpenTriggerCount] = useState(0);

  /* 🔊 Sound */
  const playSound = (type: "success" | "error") => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      osc.connect(gainNode);
      gainNode.connect(audioContext.destination);

      osc.frequency.value = type === "success" ? 800 : 300;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      osc.type = "sine";

      osc.start();
      osc.stop(audioContext.currentTime + 0.5);
    } catch {
      console.warn("Audio not supported");
    }
  };

  /* 🔥 MAIN SCAN HANDLER (UPDATED LOGIC) */
  const handleScan = async (empCode: string) => {
    if (!empCode.trim() || isProcessing) return;

    setIsProcessing(true);
    setScannedCode(empCode);

    const result = await scanEmployee(empCode);

    // ❌ INVALID EMPLOYEE / ERROR CASE
    if (!result.success) {
      setLastScannedEmployee(null);
      setScanTime(null);

      setPopupMessage(result.message || "Invalid Employee Code");
      setMessageType("error");

      playSound("error");
      setShowPopup(true);

      setIsProcessing(false);
      setManualInput("");
      return;
    }

    // ✅ SUCCESS CASE
    const now = new Date();
    setLastScannedEmployee(result);
    setScanTime(now);

    setPopupMessage(
      `Employee ${result.employeeName} checked ${
        result.lastScanType === "out" ? "OUT" : "IN"
      }`
    );

    setMessageType("success");
    playSound("success");
    setShowPopup(true);

    setIsProcessing(false);
    setManualInput("");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(manualInput);
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage(null);
    setLastScannedEmployee(null);
    setScanTime(null);
    setScannedCode(null);

    // 🔁 reopen scanner
    setScannerOpenTriggerCount((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6  max-w-lg mx-auto relative">
      <h2 className="text-2xl sm:text-3xl font-bold text-center">
        Supervisor Attendance Scanner
      </h2>

      {/* ⏳ Loader */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-40">
          <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        </div>
      )}

      {/* 📷 Scanner */}
      <Card className="w-full border p-2 rounded">
        <BarcodeScanner
          onScan={handleScan}
          fps={10}
          qrboxSize={300}
          openTriggerCount={scannerOpenTriggerCount}
        />
      </Card>

      {/* ✍️ Manual Input */}
      <form
        onSubmit={handleManualSubmit}
        className="w-full flex flex-col sm:flex-row gap-2 mt-2"
      >
        <input
          type="text"
          placeholder="Enter EmpCode manually"
          className="border rounded px-3 py-2 flex-1"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value.toUpperCase())}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Submit
        </button>
      </form>

      {/* 🚨 POPUP (SAME UI, DIFFERENT MESSAGE) */}
      {showPopup && popupMessage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={closePopup}
        >
          <Card
            className="max-w-md w-full border-2 border-slate-300 bg-white cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="text-center space-y-3">
              <div className="flex justify-center">
                <User
                  className={`h-8 w-8 ${
                    messageType === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                />
              </div>

              <h4 className="font-bold text-lg">{popupMessage}</h4>

              {/* 👇 SHOW SCANNED CODE ALWAYS */}
              {scannedCode && (
                <p className="text-sm text-gray-600">
                  Scanned Code:{" "}
                  <span className="font-semibold">{scannedCode}</span>
                </p>
              )}

              {/* ✅ Extra info only for success */}
              {messageType === "success" && lastScannedEmployee && (
                <>
                  <Badge>
                    {lastScannedEmployee.lastScanType === "out"
                      ? "Checked OUT"
                      : "Checked IN"}
                  </Badge>

                  {scanTime && (
                    <div className="flex justify-center items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {scanTime.toLocaleTimeString()}
                    </div>
                  )}
                </>
              )}

              <button
                onClick={closePopup}
                className="mt-4 px-4 py-2 bg-primary text-white rounded"
              >
                OK
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
