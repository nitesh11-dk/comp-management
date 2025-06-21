"use client"

import { useState, useEffect } from "react"
import { dataStore } from "../../lib/data-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Scan, Clock, User, Building } from "lucide-react"

export default function BarcodeScanner() {
  const [barcodeInput, setBarcodeInput] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [scannedEmployee, setScannedEmployee] = useState<any>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info")
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  useEffect(() => {
    setDepartments(dataStore.getDepartments())
    loadRecentLogs()
  }, [])

  const loadRecentLogs = () => {
    const logs = dataStore.getAttendanceLogs().slice(0, 10)
    const logsWithEmployeeData = logs.map((log) => ({
      ...log,
      employee: dataStore.getEmployeeById(log.employeeId),
      department: dataStore.getDepartmentById(log.departmentId),
    }))
    setRecentLogs(logsWithEmployeeData)
  }

  const handleScan = () => {
    if (!barcodeInput.trim()) {
      setMessage("Please enter a barcode")
      setMessageType("error")
      return
    }

    const employee = dataStore.getEmployeeByBarcode(barcodeInput.trim())
    if (!employee) {
      setMessage("Employee not found with this barcode")
      setMessageType("error")
      setScannedEmployee(null)
      return
    }

    setScannedEmployee(employee)
    setSelectedDepartment(employee.departmentId) // Default to employee's department
    setMessage(`Employee found: ${employee.name} (${employee.empCode})`)
    setMessageType("info")
  }

  const handleAttendance = () => {
    if (!scannedEmployee) return

    const now = new Date()
    const today = now.toISOString().split("T")[0]
    const lastLog = dataStore.getLastAttendanceLog(scannedEmployee.id)

    // Check if there's already a log for today
    const todayLog = dataStore.getAttendanceLogs(scannedEmployee.id, today)[0]

    try {
      if (!todayLog || (todayLog && todayLog.outTime)) {
        // Record IN time
        const newLog = dataStore.createAttendanceLog({
          employeeId: scannedEmployee.id,
          inTime: now.toISOString(),
          departmentId: selectedDepartment || scannedEmployee.departmentId,
        })

        setMessage(`✅ IN time recorded for ${scannedEmployee.name} at ${now.toLocaleTimeString()}`)
        setMessageType("success")
      } else if (todayLog && !todayLog.outTime) {
        // Record OUT time
        const updatedLog = dataStore.updateAttendanceLog(todayLog.id, {
          outTime: now.toISOString(),
        })

        setMessage(
          `✅ OUT time recorded for ${scannedEmployee.name} at ${now.toLocaleTimeString()}. Total hours: ${updatedLog?.totalHours || 0}`,
        )
        setMessageType("success")
      }

      // Clear form and reload logs
      setBarcodeInput("")
      setScannedEmployee(null)
      setSelectedDepartment("")
      loadRecentLogs()
    } catch (error) {
      setMessage("Error recording attendance. Please try again.")
      setMessageType("error")
    }
  }

  const getCurrentStatus = (employeeId: string) => {
    const today = new Date().toISOString().split("T")[0]
    const todayLog = dataStore.getAttendanceLogs(employeeId, today)[0]

    if (!todayLog) return "Not checked in"
    if (todayLog.inTime && !todayLog.outTime) return "Currently IN"
    if (todayLog.outTime) return "Checked OUT"
    return "Unknown"
  }

  // Simulate barcode scanner input (for demo purposes)
  const simulateBarcodeScan = (barcodeId: string) => {
    setBarcodeInput(barcodeId)
    setTimeout(() => handleScan(), 100)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Barcode Scanner</h2>
        <p className="text-muted-foreground">Scan employee barcode to record attendance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scan Employee Barcode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Scan or enter barcode..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleScan()}
              className="flex-1"
            />
            <Button onClick={handleScan}>
              <Scan className="h-4 w-4 mr-2" />
              Scan
            </Button>
          </div>

          {/* Demo barcode buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => simulateBarcodeScan("RVK123BARCODE")}>
              Demo: RVK123
            </Button>
            <Button size="sm" variant="outline" onClick={() => simulateBarcodeScan("PRS456BARCODE")}>
              Demo: PRS456
            </Button>
            <Button size="sm" variant="outline" onClick={() => simulateBarcodeScan("AMS789BARCODE")}>
              Demo: AMS789
            </Button>
          </div>

          {message && (
            <Alert variant={messageType === "error" ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {scannedEmployee && (
            <Card className="border-2 border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{scannedEmployee.name}</h3>
                    <p className="text-muted-foreground">{scannedEmployee.empCode}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant={getCurrentStatus(scannedEmployee.id) === "Currently IN" ? "default" : "secondary"}>
                      {getCurrentStatus(scannedEmployee.id)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Default Department: {departments.find((d) => d.id === scannedEmployee.departmentId)?.name}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Working Department (if different)</label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAttendance} className="w-full" size="lg">
                    <Clock className="h-4 w-4 mr-2" />
                    Record Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent logs</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{log.employee?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.employee?.empCode} • {log.department?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.status === "IN" ? "default" : "secondary"}>{log.status}</Badge>
                      <span className="text-sm">
                        {new Date(log.status === "IN" ? log.inTime : log.outTime).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.totalHours > 0 && <p className="text-sm text-muted-foreground">{log.totalHours}h worked</p>}
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
