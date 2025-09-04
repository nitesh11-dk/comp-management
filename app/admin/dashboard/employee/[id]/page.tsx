"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import html2canvas from "html2canvas"
import { getEmployeeById } from "@/actions/employeeActions"
import { getDepartmentById } from "@/actions/department"
import Barcode from "react-barcode"

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [department, setDepartment] = useState<any>(null)
  const barcodeRef = useRef<HTMLDivElement | null>(null)

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

  const downloadEmployeeBarcode = async () => {
    if (!barcodeRef.current) return
    try {
      const canvas = await html2canvas(barcodeRef.current, { backgroundColor: "#ffffff", scale: 2 })
      const link = document.createElement("a")
      link.download = `employee_${employee.empCode}_barcode.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (err) {
      console.error(err)
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
            <p><strong>EmpCode:</strong> {employee.empCode}</p>
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

        {/* Barcode Display and Download */}
        <Card>
          <CardHeader>
            <CardTitle>Barcode</CardTitle>
          </CardHeader>
          <CardContent className="text-center flex flex-col items-center gap-4">
            <div ref={barcodeRef} className="p-4 bg-white inline-block">
              <Barcode value={employee.empCode} width={2} height={60} fontSize={14} />
            </div>
            <Button variant="outline" onClick={downloadEmployeeBarcode} className="w-full">
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
