"use client"

import { useState } from "react"
import { ScanResult } from "@/actions/actions"
import BarcodeScanner from "@/components/BarCode"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, CheckCircle, XCircle, Clock } from "lucide-react"

type Props = {
  scanEmployee: (empCode: string) => Promise<ScanResult>
}

export default function SupervisorBarcodeScanner({ scanEmployee }: Props) {
  const [lastScannedEmployee, setLastScannedEmployee] = useState<ScanResult | null>(null)
  const [scanTime, setScanTime] = useState<Date | null>(null)
  const [message, setMessage] = useState("Ready to scan employee barcode...")
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info")
  const [isProcessing, setIsProcessing] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [showPopup, setShowPopup] = useState(false)

  const playSound = (type: "success" | "error") => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      osc.connect(gainNode)
      gainNode.connect(audioContext.destination)
      osc.frequency.value = type === "success" ? 800 : 300
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      osc.type = "sine"
      osc.start(audioContext.currentTime)
      osc.stop(audioContext.currentTime + 0.5)
    } catch {
      console.warn("Audio not supported")
    }
  }

  const handleScan = async (empCode: string) => {
    if (!empCode.trim() || isProcessing) return
    setIsProcessing(true)
    try {
      const result = await scanEmployee(empCode)
      setLastScannedEmployee(result)
      const now = new Date()
      setScanTime(now)
      setMessage(
        `✅ Employee ${result.employeeName} (Code: ${result.empCode}) CHECKED ${result.lastScanType?.toUpperCase()} at ${now.toLocaleTimeString()}`
      )
      setMessageType("success")
      playSound("success")
      setShowPopup(true) // show the popup when scanned
    } catch (err: any) {
      console.error(err)
      setMessage(`❌ ${err.message}`)
      setMessageType("error")
      playSound("error")
      setShowPopup(true) // show error popup
    } finally {
      setIsProcessing(false)
      setManualInput("")
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScan(manualInput)
  }

  const closePopup = () => {
    setShowPopup(false)
    setLastScannedEmployee(null)
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 px-4 py-4 max-w-lg mx-auto relative">
      <h2 className="text-2xl sm:text-3xl font-bold text-center">Supervisor Attendance Scanner</h2>

      {/* Camera scanner */}
      <Card className="w-full border p-2 rounded">
        <BarcodeScanner
          onScan={handleScan}
          fps={10}
          qrboxSize={300}
          style={{ margin: "0 auto", maxWidth: "100%" }}
        />
      </Card>

      {/* Manual empCode input */}
      <form onSubmit={handleManualSubmit} className="w-full flex flex-col sm:flex-row gap-2 mt-2">
        <input
          type="text"
          placeholder="Enter EmpCode manually"
          className="border rounded px-3 py-2 flex-1 text-center sm:text-left w-full"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value.toUpperCase())}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 w-full sm:w-auto"
        >
          Submit
        </button>
      </form>

      {/* Popup Overlay */}
      {showPopup && lastScannedEmployee && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={closePopup} // click anywhere to close
        >
          <Card
            className="max-w-md w-full border-2 border-green-200 bg-green-50 cursor-pointer"
            onClick={(e) => e.stopPropagation()} // prevent closing if clicked inside card
          >
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="p-2 rounded-full bg-green-100">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="font-bold text-lg">{lastScannedEmployee.employeeName}</h4>
                  <p className="text-sm text-gray-500">EmpCode: {lastScannedEmployee.empCode}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 mt-1">
                    <Badge variant="default">
                      {lastScannedEmployee.lastScanType === "out" ? "Checked OUT" : "Currently IN"}
                    </Badge>
                    {scanTime && (
                      <div className="flex items-center gap-1 text-gray-600 text-sm">
                        <Clock className="h-4 w-4" />
                        {scanTime.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closePopup}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  >
                    OK
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
