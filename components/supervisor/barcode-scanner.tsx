"use client"

import { useState } from "react"
import { ScanResult } from "@/actions/actions"
import BarcodeScanner from "../barcode-scanner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Scan, User, CheckCircle, XCircle } from "lucide-react"

type Props = {
  scanEmployee: (employeeId: string) => Promise<ScanResult>
}

export default function SupervisorBarcodeScanner({ scanEmployee }: Props) {
  const [lastScannedEmployee, setLastScannedEmployee] = useState<ScanResult | null>(null)
  const [message, setMessage] = useState("Ready to scan employee barcode...")
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | "warning">("info")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScannerActive, setIsScannerActive] = useState(false)
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
    } catch { console.warn("Audio not supported") }
  }

  const handleScan = async (employeeId: string) => {
    if (!employeeId.trim() || isProcessing) return
    setIsProcessing(true)
    try {
      const result = await scanEmployee(employeeId)
      setLastScannedEmployee(result)
      setMessage(`✅ Employee ${result.employeeName} CHECKED ${result.lastScanType?.toUpperCase()}`)
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

  const toggleScanner = () => setIsScannerActive(!isScannerActive)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Supervisor Attendance Scanner</h2>

      <Card className="border-2 border-dashed border-primary">
        <CardContent>
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className={`p-3 rounded-full ${isProcessing ? "bg-yellow-100" : "bg-primary/10"}`}>
                <Scan className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>

            <Alert variant={messageType === "error" ? "destructive" : "default"}>
              <div className="flex items-start gap-2">
                {messageType === "success" && <CheckCircle className="h-4 w-4 mt-0.5" />}
                {messageType === "error" && <XCircle className="h-4 w-4 mt-0.5" />}
                <AlertDescription>{message}</AlertDescription>
              </div>
            </Alert>

            {lastScannedEmployee && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent>
                  <div className="flex items-center justify-center gap-4">
                    <div className="p-2 rounded-full bg-green-100">
                      <User className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-lg">{lastScannedEmployee.employeeName}</h4>
                      <p className="text-sm text-gray-500">ID: {lastScannedEmployee.employeeId}</p>
                      <Badge variant="default" className="mt-1">
                        {lastScannedEmployee.lastScanType === "out" ? "Checked OUT" : "Currently IN"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">


        <BarcodeScanner
          onScan={handleScan}
          isActive={isScannerActive}
          onToggle={toggleScanner}
        />



      </div>
    </div>
  )
}
