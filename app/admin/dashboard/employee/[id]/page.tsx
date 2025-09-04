"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import html2canvas from "html2canvas"
import { getEmployeeById } from "@/actions/employeeActions"
import { getDepartmentById } from "@/actions/department"

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [department, setDepartment] = useState<any>(null)

  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!params.id) return
      try {
        const empRes = await getEmployeeById(params.id)
        if (!empRes.success || !empRes.data) {
          router.push("/")
          return
        }
        setEmployee(empRes.data)

        const deptRes = await getDepartmentById(empRes.data.departmentId)
        if (deptRes.success && deptRes.data) setDepartment(deptRes.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadEmployeeData()
  }, [params.id, router])

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
      const canvas = await html2canvas(tempDiv.firstChild as HTMLElement, { backgroundColor: "#ffffff", scale: 2 })
      const link = document.createElement("a")
      link.download = `employee_${id}_barcode.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (err) {
      console.error(err)
    } finally {
      document.body.removeChild(tempDiv)
    }
  }

  if (!employee) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{employee.name}</h1>
      </div>

      {/* Employee Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Employee Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>ID:</strong> {employee._id}</p>
            <p><strong>Name:</strong> {employee.name}</p>
            <p><strong>Mobile:</strong> {employee.mobile}</p>
            <p><strong>Aadhaar:</strong> {employee.aadhaarNumber}</p>
            <p><strong>PF ID:</strong> {employee.pfId || "N/A"}</p>
            <p><strong>ESIC ID:</strong> {employee.esicId || "N/A"}</p>
            <p><strong>Department:</strong> {department?.name || "N/A"}</p>
            <p><strong>Shift Type:</strong> {employee.shiftType}</p>
            <p><strong>Hourly Rate:</strong> ₹{employee.hourlyRate}</p>
            <p><strong>Profile Complete:</strong> {employee.profileComplete ? "Yes" : "No"}</p>
          </CardContent>
        </Card>

        {/* Download Barcode Button */}
        <Card>
          <CardHeader>
            <CardTitle>Barcode</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => downloadEmployeeBarcode(employee._id)} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Barcode
            </Button>
          </CardContent>
        </Card>

        {/* Static Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Total Working Days:</strong> 22</p>
            <p><strong>Total Hours:</strong> 160h</p>
            <p><strong>Estimated Salary:</strong> ₹{160 * employee.hourlyRate}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
