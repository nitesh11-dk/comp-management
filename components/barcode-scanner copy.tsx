"use client"

import { useState } from "react"
import { ScanResult } from "@/actions/actions"
import BarcodeScanner from "@/components/BarCode" // reusable scanner
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
      setMessage(`✅ Employee ${result.employeeName} CHECKED ${result.lastScanType?.toUpperCase()} at ${now.toLocaleTimeString()}`)
      setMessageType("success")
      playSound("success")
    } catch (err: any) {
      console.error(err)
      setMessage(`❌ ${err.message}`)
      setMessageType("error")
      playSound("error")
    } finally {
      setIsProcessing(false)
      setManualInput("")
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScan(manualInput)
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6 px-2 sm:px-4 py-4 max-w-lg mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-center">Supervisor Attendance Scanner</h2>

      <Card className="w-full border-2 border-dashed border-primary">
        <CardContent className="space-y-4">
          <div className="w-full text-center">
            <Alert variant={messageType === "error" ? "destructive" : "default"}>
              <div className="flex items-start justify-center gap-2">
                {messageType === "success" && <CheckCircle className="h-5 w-5 mt-0.5" />}
                {messageType === "error" && <XCircle className="h-5 w-5 mt-0.5" />}
                <AlertDescription>{message}</AlertDescription>
              </div>
            </Alert>

            {lastScannedEmployee && (
              <Card className="border-2 border-green-200 bg-green-50 mt-4">
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <div className="p-2 rounded-full bg-green-100">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="font-bold text-lg">{lastScannedEmployee.employeeName}</h4>
                      <p className="text-sm text-gray-500">ID: {lastScannedEmployee.employeeId}</p>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Camera scanner */}
      <Card className="w-full border p-2 rounded">
        <BarcodeScanner
          onScan={handleScan}
          fps={10}
          qrboxSize={300}
          style={{ margin: "0 auto" }}
        />
      </Card>

      {/* Manual empCode input */}
      <form onSubmit={handleManualSubmit} className="w-full flex flex-col sm:flex-row gap-2 mt-2">
        <input
          type="text"
          placeholder="Enter EmpCode manually"
          className="border rounded px-3 py-2 flex-1 text-center sm:text-left"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value.toUpperCase())}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Submit
        </button>
      </form>
    </div>
  )
}
