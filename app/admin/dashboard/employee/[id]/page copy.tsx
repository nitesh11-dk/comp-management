"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Calendar, Clock, User, Building2 } from "lucide-react"
import Barcode from "react-barcode"
import html2canvas from "html2canvas"
import dayjs from "dayjs"
import { getEmployeeById } from "@/actions/employeeActions" // your API to fetch employee by ID
import { getDepartmentById } from "@/actions/department" // your API to fetch department by ID

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [department, setDepartment] = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"))
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

  useEffect(() => {
    if (params.id) {
      loadEmployeeData()
    }
  }, [params.id, selectedMonth])

  const loadEmployeeData = async () => {
    try {
      const empRes = await getEmployeeById(params.id as string)
      if (!empRes.success || !empRes.data) {
        router.push("/")
        return
      }
      setEmployee(empRes.data)

      // Fetch department
      const deptRes = await getDepartmentById(empRes.data.departmentId)
      if (deptRes.success && deptRes.data) setDepartment(deptRes.data)

      // Simulate attendance summary (replace with your real API)
      const [year, month] = selectedMonth.split("-")
      const startDate = dayjs(`${year}-${month}-01`).toDate()
      const endDate = dayjs(startDate).endOf("month").toDate()
      const summary = await fetchAttendanceSummary(empRes.data._id, startDate, endDate)
      setAttendanceData(summary)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchAttendanceSummary = async (employeeId: string, start: Date, end: Date) => {
    // Replace this with real API call
    return {
      totalDays: 22,
      totalHours: 160,
      logs: [],
      categoryStats: {},
      supervisorStats: {},
    }
  }

  const downloadEmployeeBarcode = async (id: string) => {
    const tempDiv = document.createElement("div")
    tempDiv.style.position = "absolute"
    tempDiv.style.left = "-9999px"
    tempDiv.innerHTML = `<div style="background: white; padding: 20px;">
      <svg id="temp-barcode"></svg>
    </div>`
    document.body.appendChild(tempDiv)

    const JsBarcode = require("jsbarcode")
    JsBarcode("#temp-barcode", id, {
      width: 2,
      height: 60,
      fontSize: 14,
      background: "#ffffff",
      lineColor: "#000000",
    })

    try {
      const canvas = await html2canvas(tempDiv.firstChild as HTMLElement, {
        backgroundColor: "#ffffff",
        scale: 2,
      })

      const link = document.createElement("a")
      link.download = `employee_${id}_barcode.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Error downloading barcode:", error)
    } finally {
      document.body.removeChild(tempDiv)
    }
  }

  const exportAttendanceData = () => {
    if (!attendanceData || !employee) return

    const csvData = [
      ["Date", "In Time", "Out Time", "Total Hours", "Category", "Supervisor", "Status"],
      ...attendanceData.logs.map((log: any) => [
        dayjs(log.date).format("DD/MM/YYYY"),
        log.inTime ? dayjs(log.inTime).format("HH:mm") : "-",
        log.outTime ? dayjs(log.outTime).format("HH:mm") : "-",
        log.totalHours || 0,
        log.department?.name || "-",
        log.supervisor?.name || "-",
        log.status,
      ]),
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${employee.name}_attendance_${selectedMonth}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (log: any) => {
    if (!log.inTime) return "bg-red-100 text-red-800"
    if (!log.outTime) return "bg-yellow-100 text-yellow-800"
    if (log.totalHours >= 8) return "bg-green-100 text-green-800"
    if (log.totalHours >= 4) return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
  }

  const getStatusText = (log: any) => {
    if (!log.inTime) return "Absent"
    if (!log.outTime) return "In Progress"
    if (log.totalHours >= 8) return "Full Day"
    if (log.totalHours >= 4) return "Half Day"
    return "Short Day"
  }

  const generateCalendarDays = () => {
    const startOfMonth = dayjs(selectedMonth).startOf("month")
    const endOfMonth = dayjs(selectedMonth).endOf("month")
    const startDate = startOfMonth.startOf("week")
    const endDate = endOfMonth.endOf("week")

    const days = []
    let current = startDate

    while (current.isBefore(endDate) || current.isSame(endDate)) {
      const dateStr = current.format("YYYY-MM-DD")
      const log = attendanceData?.logs.find((l: any) => l.date === dateStr)

      days.push({
        date: current,
        log,
        isCurrentMonth: current.isSame(startOfMonth, "month"),
      })

      current = current.add(1, "day")
    }

    return days
  }

  if (!employee) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button variant="outline" onClick={() => router.back()} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{employee.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Employee ID: {employee._id}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "calendar" ? "list" : "calendar")}
            className="w-full sm:w-auto"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {viewMode === "calendar" ? "List View" : "Calendar View"}
          </Button>
          <Button variant="outline" onClick={exportAttendanceData} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Employee Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Employee Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="font-medium">{employee.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Mobile</label>
              <p className="font-medium">{employee.mobile}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Aadhaar</label>
              <p className="font-medium">{employee.aadhaarNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <p className="font-medium">{department?.name || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Hourly Rate</label>
              <p className="font-medium">₹{employee.hourlyRate}</p>
            </div>
          </CardContent>
        </Card>

        {/* Barcode */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Barcode</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">
              <Barcode value={employee._id} width={2} height={60} fontSize={14} />
            </div>
            <Button variant="outline" onClick={() => downloadEmployeeBarcode(employee._id)} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Barcode
            </Button>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendanceData && (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Working Days</label>
                  <p className="text-2xl font-bold text-green-600">{attendanceData.totalDays}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Hours</label>
                  <p className="text-2xl font-bold text-blue-600">{attendanceData.totalHours.toFixed(1)}h</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estimated Salary</label>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{(attendanceData.totalHours * employee.hourlyRate).toFixed(0)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>




      {/* Month Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Attendance Records</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = dayjs().subtract(i, "month")
                  return (
                    <SelectItem key={date.format("YYYY-MM")} value={date.format("YYYY-MM")}>
                      {date.format("MMMM YYYY")}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === "calendar" ? (
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm font-medium text-muted-foreground">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {generateCalendarDays().map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 border rounded-lg ${day.isCurrentMonth ? "bg-white" : "bg-gray-50"
                      } ${day.log ? getStatusColor(day.log) : ""}`}
                  >
                    <div className="text-xs sm:text-sm font-medium">{day.date.format("D")}</div>
                    {day.log && day.isCurrentMonth && (
                      <div className="text-xs space-y-1">
                        <div className="hidden sm:block">{getStatusText(day.log)}</div>
                        {day.log.inTime && (
                          <div className="hidden sm:block">In: {dayjs(day.log.inTime).format("HH:mm")}</div>
                        )}
                        {day.log.outTime && (
                          <div className="hidden sm:block">Out: {dayjs(day.log.outTime).format("HH:mm")}</div>
                        )}
                        {day.log.totalHours > 0 && (
                          <div className="font-medium text-xs">{day.log.totalHours.toFixed(1)}h</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {attendanceData?.logs.map((log: any) => (
                <Card key={log.id} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-center">
                        <div className="text-base sm:text-lg font-bold">{dayjs(log.date).format("DD")}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{dayjs(log.date).format("MMM")}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">
                            {log.inTime ? dayjs(log.inTime).format("HH:mm") : "--:--"} -{" "}
                            {log.outTime ? dayjs(log.outTime).format("HH:mm") : "--:--"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">{log.department?.name || "N/A"}</span>
                        </div>
                        {log.supervisor && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs sm:text-sm">{log.supervisor.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right space-y-2 w-full sm:w-auto">
                      <Badge className={getStatusColor(log)} size="sm">
                        {getStatusText(log)}
                      </Badge>
                      {log.totalHours > 0 && (
                        <div className="text-base sm:text-lg font-bold">{log.totalHours.toFixed(1)}h</div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category and Supervisor Summary */}
      {attendanceData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Work by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {Object.entries(attendanceData.categoryStats).map(([categoryId, stats]: [string, any]) => (
                  <div key={categoryId} className="flex justify-between items-center p-2 sm:p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm sm:text-base">{stats.name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{stats.days} days</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm sm:text-base">{stats.hours.toFixed(1)}h</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        ₹{(stats.hours * employee.hourlyRate).toFixed(0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Supervisors Worked With</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {Object.entries(attendanceData.supervisorStats).map(([supervisorId, stats]: [string, any]) => (
                  <div key={supervisorId} className="flex justify-between items-center p-2 sm:p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm sm:text-base">{stats.name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{stats.days} days</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm sm:text-base">{stats.hours.toFixed(1)}h</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
