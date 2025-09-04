"use client"

import { useState, useEffect, useRef } from "react"
import { getEmployees } from "@/actions/employeeActions"
import { getDepartments } from "@/actions/department"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Clock, Calendar, Building, Download } from "lucide-react"
import html2canvas from "html2canvas"
import Barcode from "react-barcode"

export default function EmployeeDashboard() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Store refs for barcode download
  const barcodeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [empRes, deptRes] = await Promise.all([getEmployees(), getDepartments()])

        if (empRes.success && deptRes.success) {
          // Merge department info manually
          const merged = empRes.data.map(emp => {
            const dept = deptRes.data.find((d: any) => d._id === emp.departmentId.toString())
            return {
              ...emp,
              departmentName: dept?.name || "Unknown",
              departmentDescription: dept?.description || "",
            }
          })
          setEmployees(merged)
          setDepartments(deptRes.data)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const downloadBarcode = async (empCode: string) => {
    const barcodeDiv = barcodeRefs.current[empCode]
    if (!barcodeDiv) return
    try {
      const canvas = await html2canvas(barcodeDiv, { backgroundColor: "#ffffff", scale: 2 })
      const link = document.createElement("a")
      link.download = `employee_${empCode}_barcode.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Error downloading barcode:", error)
    }
  }

  const getCurrentStatus = (attendanceLogs: any[]) => {
    const today = new Date().toISOString().split("T")[0]
    const todayLog = attendanceLogs.find((log) => log.date === today)
    if (!todayLog) return { status: "Not checked in", variant: "secondary" as const }
    if (todayLog.inTime && !todayLog.outTime) return { status: "Currently IN", variant: "default" as const }
    if (todayLog.outTime) return { status: "Checked OUT", variant: "secondary" as const }
    return { status: "Unknown", variant: "secondary" as const }
  }

  const getMonthlyStats = (employee: any) => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyLogs = (employee.attendanceLogs || []).filter((log: any) => {
      const logDate = new Date(log.date)
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear
    })
    const totalHours = monthlyLogs.reduce((sum: number, log: any) => sum + (log.totalHours || 0), 0)
    const workingDays = monthlyLogs.filter((log: any) => log.outTime).length
    const totalSalary = totalHours * (employee?.hourlyRate || 0)
    return { totalHours, workingDays, totalSalary }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h2>

      {employees.map((employee) => {
        const currentStatus = getCurrentStatus(employee.attendanceLogs || [])
        const monthlyStats = getMonthlyStats(employee)

        return (
          <div key={employee._id} className="space-y-4 border-b pb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold">{employee.name}</h3>
                <p className="text-sm text-muted-foreground">Employee Code: {employee.empCode}</p>
              </div>
              <Badge variant={currentStatus.variant}>{currentStatus.status}</Badge>
            </div>

            {/* Profile */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p>PF ID: {employee.pfId || "-"}</p>
                    <p>ESIC ID: {employee.esicId || "-"}</p>
                    <p>Aadhaar: {employee.aadhaarNumber}</p>
                    <p>Mobile: {employee.mobile}</p>
                  </div>
                  <div className="space-y-1">
                    <p>Department: {employee.departmentName}</p>
                    <p>Shift: {employee.shiftType}</p>
                    <p>Hourly Rate: ₹{employee.hourlyRate}</p>
                  </div>
                </div>

                {/* Barcode */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Barcode</h4>
                  <div className="space-y-2">
                    <div
                      className="bg-white p-3 sm:p-4 rounded-lg border inline-block"
                      ref={(el) => (barcodeRefs.current[employee.empCode] = el)}
                    >
                      <Barcode value={employee.empCode} width={2} height={50} fontSize={12} />
                    </div>
                    <Button onClick={() => downloadBarcode(employee.empCode)} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" /> Download Barcode
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <Card>
                <CardContent>
                  <Clock className="h-5 w-5 text-primary" />
                  <p>Total Hours: {monthlyStats.totalHours.toFixed(1)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Calendar className="h-5 w-5 text-primary" />
                  <p>Working Days: {monthlyStats.workingDays}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Building className="h-5 w-5 text-primary" />
                  <p>Monthly Salary: ₹{monthlyStats.totalSalary.toFixed(0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="hidden sm:table-cell">Department</TableHead>
                        <TableHead>In Time</TableHead>
                        <TableHead>Out Time</TableHead>
                        <TableHead className="hidden md:table-cell">Total Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(employee.attendanceLogs || []).map((log: any) => (
                        <TableRow key={log._id}>
                          <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                          <TableCell className="hidden sm:table-cell">{employee.departmentName}</TableCell>
                          <TableCell>{log.inTime ? new Date(log.inTime).toLocaleTimeString() : "-"}</TableCell>
                          <TableCell>{log.outTime ? new Date(log.outTime).toLocaleTimeString() : "-"}</TableCell>
                          <TableCell className="hidden md:table-cell">{log.totalHours ? `${log.totalHours}h` : "-"}</TableCell>
                          <TableCell>
                            <Badge variant={log.outTime ? "secondary" : "default"}>{log.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
