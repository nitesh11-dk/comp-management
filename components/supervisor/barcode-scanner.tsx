"use client"

import { useState, useEffect } from "react"
import { dataStore } from "../../lib/data-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { roundTimeToNextHour } from "../../lib/time-utils"
import BarcodeScanner from "../barcode-scanner"
import { Scan, Clock, User, CheckCircle, XCircle, Zap, Building2, AlertTriangle } from "lucide-react"

export default function SupervisorBarcodeScanner() {
  const [lastScannedEmployee, setLastScannedEmployee] = useState<any>(null)
  const [message, setMessage] = useState("Ready to scan employee barcode...")
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | "warning">("info")
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScannerActive, setIsScannerActive] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [currentSupervisor, setCurrentSupervisor] = useState<any>(null)

  useEffect(() => {
    loadRecentLogs()
    loadCurrentSupervisor()
  }, [])

  const loadCurrentSupervisor = () => {
    const user = dataStore.getCurrentUser()
    if (user && user.role === "supervisor") {
      setCurrentSupervisor(user)
      // Set default category based on supervisor's assigned department
      if (user.departmentId) {
        setSelectedCategory(user.departmentId)
      }
    }
  }

  const loadRecentLogs = () => {
    const logs = dataStore.getAttendanceLogs().slice(0, 10)
    const logsWithEmployeeData = logs.map((log) => ({
      ...log,
      employee: dataStore.getEmployeeById(log.employeeId),
      department: dataStore.getDepartmentById(log.departmentId),
      supervisor: dataStore.getUserById(log.supervisorId),
    }))
    setRecentLogs(logsWithEmployeeData)
  }

  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn("Audio not supported")
    }
  }

  const playWarningSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 600
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.4)
    } catch (error) {
      console.warn("Audio not supported")
    }
  }

  const playErrorSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 300
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.warn("Audio not supported")
    }
  }

  const processBarcodeScan = async (scannedCode: string) => {
    if (!scannedCode.trim() || isProcessing) return

    if (!selectedCategory) {
      setMessage("❌ Please select a work category first")
      setMessageType("error")
      playErrorSound()
      return
    }

    setIsProcessing(true)

    try {
      // Find employee by barcode or empCode
      let employee = dataStore.getEmployeeByBarcode(scannedCode.trim())

      // If not found by barcode, try by empCode
      if (!employee) {
        employee = dataStore.getEmployees().find((emp) => emp.empCode === scannedCode.trim())
      }

      if (!employee) {
        setMessage(`❌ Employee not found with code: ${scannedCode}`)
        setMessageType("error")
        setLastScannedEmployee(null)
        playErrorSound()
        return
      }

      setLastScannedEmployee(employee)

      // Get current time and apply rounding logic
      const now = new Date()
      const timeData = roundTimeToNextHour(now)
      const today = now.toISOString().split("T")[0]

      // Check last attendance log for this employee
      const todayLog = dataStore.getAttendanceLogs(employee.id, today)[0]

      // Check if employee belongs to different department
      const isDifferentDepartment = employee.departmentId !== selectedCategory
      const employeeDept = dataStore.getDepartmentById(employee.departmentId)?.name || "Unknown"
      const workingDept = dataStore.getDepartmentById(selectedCategory)?.name || "Unknown"

      // Automatically determine IN or OUT
      if (!todayLog || (todayLog && todayLog.outTime)) {
        // Record IN time
        const newLog = dataStore.createAttendanceLog({
          employeeId: employee.id,
          inTime: timeData.realTime,
          displayInTime: timeData.displayTime,
          departmentId: selectedCategory, // Use selected category for work assignment
          supervisorId: currentSupervisor?.id,
          workingCategory: selectedCategory,
        })

        if (isDifferentDepartment) {
          setMessage(
            `⚠️ ${employee.name} CHECKED IN\n📝 Note: ${employeeDept} employee working in ${workingDept}\nTime: ${timeData.displayTimeFormatted}`,
          )
          setMessageType("warning")
          playWarningSound()
        } else {
          setMessage(`✅ ${employee.name} CHECKED IN\nCategory: ${workingDept}\nTime: ${timeData.displayTimeFormatted}`)
          setMessageType("success")
          playSuccessSound()
        }
      } else if (todayLog && !todayLog.outTime) {
        // Record OUT time
        const updatedLog = dataStore.updateAttendanceLog(todayLog.id, {
          outTime: timeData.realTime,
          displayOutTime: timeData.displayTime,
          outSupervisorId: currentSupervisor?.id,
        })

        const hours = updatedLog?.totalHours || 0
        const workingCategoryName = dataStore.getDepartmentById(todayLog.departmentId)?.name || todayLog.departmentId

        if (isDifferentDepartment) {
          setMessage(
            `⚠️ ${employee.name} CHECKED OUT\n📝 Note: ${employeeDept} employee was working in ${workingCategoryName}\nTime: ${timeData.displayTimeFormatted}\nTotal: ${hours.toFixed(1)}h`,
          )
          setMessageType("warning")
          playWarningSound()
        } else {
          setMessage(
            `✅ ${employee.name} CHECKED OUT\nCategory: ${workingCategoryName}\nTime: ${timeData.displayTimeFormatted}\nTotal: ${hours.toFixed(1)}h`,
          )
          setMessageType("success")
          playSuccessSound()
        }
      }

      // Reload recent logs
      loadRecentLogs()

      // Clear the scanned employee after 4 seconds (increased for warning messages)
      setTimeout(() => {
        setLastScannedEmployee(null)
        setMessage("Ready to scan next employee barcode...")
        setMessageType("info")
      }, 4000)
    } catch (error) {
      setMessage("❌ Error processing attendance. Please try again.")
      setMessageType("error")
      playErrorSound()
    } finally {
      setIsProcessing(false)
    }
  }

  const getCurrentStatus = (employeeId: string) => {
    const today = new Date().toISOString().split("T")[0]
    const todayLog = dataStore.getAttendanceLogs(employeeId, today)[0]

    if (!todayLog) return { status: "Not checked in", variant: "secondary" as const }
    if (todayLog.inTime && !todayLog.outTime) return { status: "Currently IN", variant: "default" as const }
    if (todayLog.outTime) return { status: "Checked OUT", variant: "secondary" as const }
    return { status: "Unknown", variant: "secondary" as const }
  }

  const handleScannerToggle = () => {
    setIsScannerActive(!isScannerActive)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center px-2">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Supervisor Attendance Scanner</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Scan employee barcode to automatically record attendance
        </p>
        {currentSupervisor && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Logged in as: <span className="font-medium">{currentSupervisor.name}</span>
          </p>
        )}
      </div>

      {/* Category Selection */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Work Category Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select work category for this scan session:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Choose work category..." />
              </SelectTrigger>
              <SelectContent>
                {dataStore.getDepartments().map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600">
                  <strong>Current Assignment:</strong> {dataStore.getDepartmentById(selectedCategory)?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ℹ️ Employees from other departments will be marked with a note
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scanner Status */}
      <Card className="border-2 border-dashed border-primary">
        <CardContent className="pt-4 sm:pt-6">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="flex justify-center">
              {isProcessing ? (
                <div className="p-3 sm:p-4 bg-yellow-100 rounded-full">
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 animate-pulse" />
                </div>
              ) : (
                <div className="p-3 sm:p-4 bg-primary/10 rounded-full">
                  <Scan className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold">{isProcessing ? "Processing..." : "Ready to Scan"}</h3>

              <Alert
                variant={messageType === "error" ? "destructive" : messageType === "warning" ? "default" : "default"}
                className={`text-left ${messageType === "warning" ? "border-orange-200 bg-orange-50" : ""}`}
              >
                <div className="flex items-start gap-2">
                  {messageType === "success" && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  {messageType === "error" && <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  {messageType === "warning" && (
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-600" />
                  )}
                  {messageType === "info" && <Scan className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                  <AlertDescription
                    className={`font-medium whitespace-pre-line text-sm sm:text-base ${messageType === "warning" ? "text-orange-800" : ""}`}
                  >
                    {message}
                  </AlertDescription>
                </div>
              </Alert>
            </div>

            {/* Show scanned employee info */}
            {lastScannedEmployee && (
              <Card
                className={`border-2 ${messageType === "warning" ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}`}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className={`p-2 rounded-full ${messageType === "warning" ? "bg-orange-100" : "bg-green-100"}`}>
                      <User className={`h-6 w-6 ${messageType === "warning" ? "text-orange-600" : "text-green-600"}`} />
                    </div>
                    <div className="text-center">
                      <h4
                        className={`font-bold text-lg ${messageType === "warning" ? "text-orange-800" : "text-green-800"}`}
                      >
                        {lastScannedEmployee.name}
                      </h4>
                      <p className={`${messageType === "warning" ? "text-orange-600" : "text-green-600"}`}>
                        {lastScannedEmployee.empCode}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <Badge variant={getCurrentStatus(lastScannedEmployee.id).variant}>
                          {getCurrentStatus(lastScannedEmployee.id).status}
                        </Badge>
                        {lastScannedEmployee.departmentId !== selectedCategory && (
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                            Cross-Dept
                          </Badge>
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

      {/* Enhanced Camera Scanner */}
      <BarcodeScanner onScan={processBarcodeScan} isActive={isScannerActive} onToggle={handleScannerToggle} />

      {/* Quick Test Buttons (for demo) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Demo Test Buttons</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-6">
          <div className="flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => processBarcodeScan("RVK123")}
              className="px-3 py-2 text-xs sm:text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
              disabled={isProcessing || !selectedCategory}
            >
              Test: RVK123
            </button>
            <button
              onClick={() => processBarcodeScan("PRS456")}
              className="px-3 py-2 text-xs sm:text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors"
              disabled={isProcessing || !selectedCategory}
            >
              Test: PRS456
            </button>
            <button
              onClick={() => processBarcodeScan("AMS789")}
              className="px-3 py-2 text-xs sm:text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
              disabled={isProcessing || !selectedCategory}
            >
              Test: AMS789
            </button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            These buttons simulate barcode scanning for testing
          </p>
        </CardContent>
      </Card>

      {/* Recent Attendance Logs */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            Live Attendance Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
            {recentLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm sm:text-base">No attendance records yet</p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-2 sm:space-y-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${log.status === "IN" ? "bg-green-100" : "bg-red-100"}`}>
                      <User
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${log.status === "IN" ? "text-green-600" : "text-red-600"}`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">{log.employee?.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {log.employee?.empCode} • {log.department?.name}
                      </p>
                      {log.supervisor && (
                        <p className="text-xs text-muted-foreground">Supervisor: {log.supervisor.name}</p>
                      )}
                      {log.employee?.departmentId !== log.departmentId && (
                        <p className="text-xs text-orange-600">
                          📝 Cross-department: {dataStore.getDepartmentById(log.employee?.departmentId)?.name} →{" "}
                          {log.department?.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 sm:gap-1 mb-1">
                      <Badge variant={log.status === "IN" ? "default" : "secondary"} className="text-xs">
                        {log.status}
                      </Badge>
                      <div className="text-xs sm:text-sm">
                        <div className="font-mono">
                          {log.displayInTime || log.displayOutTime
                            ? new Date(
                              log.status === "IN" ? log.displayInTime : log.displayOutTime,
                            ).toLocaleTimeString()
                            : new Date(log.status === "IN" ? log.inTime : log.outTime).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {log.totalHours > 0 && (
                      <p className="text-xs text-muted-foreground">Total: {log.totalHours.toFixed(1)}h</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
