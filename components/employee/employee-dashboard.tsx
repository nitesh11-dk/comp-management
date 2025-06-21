"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/auth-context"
import { dataStore } from "../../lib/data-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Clock, Calendar, Building, Edit, Download } from "lucide-react"
import html2canvas from "html2canvas"

// Add this import at the top
import Barcode from "react-barcode"

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [employee, setEmployee] = useState<any>(null)
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
  const [department, setDepartment] = useState<any>(null)
  const [shift, setShift] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const barcodeRef = useRef<HTMLDivElement>(null)

  const downloadMyBarcode = async (empCode: string) => {
    if (!barcodeRef.current) return

    try {
      const canvas = await html2canvas(barcodeRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      })

      const link = document.createElement("a")
      link.download = `employee_${empCode}_barcode.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Error downloading barcode:", error)
    }
  }

  useEffect(() => {
    if (user?.employeeId) {
      loadEmployeeData()
    }
  }, [user])

  const loadEmployeeData = () => {
    const emp = dataStore.getEmployeeById(user!.employeeId!)
    if (emp) {
      setEmployee(emp)
      setFormData(emp)
      setDepartment(dataStore.getDepartmentById(emp.departmentId))
      setShift(dataStore.getShiftById(emp.shiftType))

      // Load attendance logs for current month
      const logs = dataStore.getAttendanceLogs(emp.id)
      const logsWithDepartments = logs.map((log) => ({
        ...log,
        departmentName: dataStore.getDepartmentById(log.departmentId)?.name,
      }))
      setAttendanceLogs(logsWithDepartments)
    }
  }

  const getCurrentStatus = () => {
    const today = new Date().toISOString().split("T")[0]
    const todayLog = attendanceLogs.find((log) => log.date === today)

    if (!todayLog) return { status: "Not checked in", variant: "secondary" as const }
    if (todayLog.inTime && !todayLog.outTime) return { status: "Currently IN", variant: "default" as const }
    if (todayLog.outTime) return { status: "Checked OUT", variant: "secondary" as const }
    return { status: "Unknown", variant: "secondary" as const }
  }

  const getMonthlyStats = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyLogs = attendanceLogs.filter((log) => {
      const logDate = new Date(log.date)
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear
    })

    const totalHours = monthlyLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0)
    const workingDays = monthlyLogs.filter((log) => log.outTime).length
    const totalSalary = totalHours * (employee?.hourlyRate || 0)

    return { totalHours, workingDays, totalSalary }
  }

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()

    // Only allow updating certain fields
    const allowedUpdates = {
      name: formData.name,
      mobile: formData.mobile,
      aadhaarNumber: formData.aadhaarNumber,
      profileComplete: true,
    }

    dataStore.updateEmployee(employee.id, allowedUpdates)
    loadEmployeeData()
    setIsEditDialogOpen(false)
  }

  if (!employee) {
    return <div>Loading...</div>
  }

  const currentStatus = getCurrentStatus()
  const monthlyStats = getMonthlyStats()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">My Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Welcome back, {employee.name}</p>
        </div>
        <Badge variant={currentStatus.variant} className="self-start sm:self-auto">
          {currentStatus.status}
        </Badge>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            My Profile
          </CardTitle>
          {!employee.profileComplete && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Complete Profile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Your Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile || ""}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                    <Input
                      id="aadhaarNumber"
                      value={formData.aadhaarNumber || ""}
                      onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Profile</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Employee Code</p>
                <p className="font-medium text-sm sm:text-base">{employee.empCode}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">PF ID</p>
                <p className="font-medium text-sm sm:text-base">{employee.pfId}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">ESIC ID</p>
                <p className="font-medium text-sm sm:text-base">{employee.esicId}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Department</p>
                <p className="font-medium text-sm sm:text-base">{department?.name}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Shift Type</p>
                <p className="font-medium text-sm sm:text-base">{shift?.name}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Hourly Rate</p>
                <p className="font-medium text-sm sm:text-base">₹{employee.hourlyRate}</p>
              </div>
            </div>
          </div>

          {/* Add this section after the profile information grid: */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3 text-sm sm:text-base">My Barcode</h4>
            <div className="space-y-3">
              <div className="bg-white p-3 sm:p-4 rounded-lg border inline-block" ref={barcodeRef}>
                <Barcode value={employee.empCode} width={2} height={50} fontSize={12} />
              </div>
              <div>
                <Button
                  onClick={() => downloadMyBarcode(employee.empCode)}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download My Barcode
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Use this barcode for attendance scanning</p>
            </div>
          </div>

          {!employee.profileComplete && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">Please complete your profile to ensure accurate records.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Hours</p>
                <p className="text-xl sm:text-2xl font-bold">{monthlyStats.totalHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Working Days</p>
                <p className="text-xl sm:text-2xl font-bold">{monthlyStats.workingDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Monthly Salary</p>
                <p className="text-xl sm:text-2xl font-bold">₹{monthlyStats.totalSalary.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Logs */}
      <Card>
        <CardHeader>
          <CardTitle>My Attendance History</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">Date</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">Department</TableHead>
                  <TableHead className="min-w-[80px]">In Time</TableHead>
                  <TableHead className="min-w-[80px]">Out Time</TableHead>
                  <TableHead className="min-w-[80px] hidden md:table-cell">Total Hours</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs sm:text-sm">{new Date(log.date).toLocaleDateString()}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{log.departmentName}</TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {log.inTime ? new Date(log.inTime).toLocaleTimeString() : "-"}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {log.outTime ? new Date(log.outTime).toLocaleTimeString() : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                      {log.totalHours ? `${log.totalHours}h` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.status === "IN" ? "default" : "secondary"} className="text-xs">
                        {log.outTime ? "Complete" : log.status}
                      </Badge>
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
}
