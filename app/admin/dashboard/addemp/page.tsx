"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createEmployee } from "@/actions/employeeActions"
import { getDepartments } from "@/actions/department"
import { getShiftTypes } from "@/actions/shiftType"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { UserPlus, Download, Trash2 } from "lucide-react"
import Barcode from "react-barcode"
import html2canvas from "html2canvas"

export default function AddEmployeePage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    aadhaarNumber: "",
    mobile: "",
    departmentId: "",
    shiftTypeId: "",
    pfId: "",
    esicId: "",
    hourlyRate: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [departments, setDepartments] = useState<any[]>([])
  const [shiftTypes, setShiftTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")
  const [generatedEmployee, setGeneratedEmployee] = useState<any>(null)

  const barcodeRef = useRef<HTMLDivElement>(null)

  // Load Departments & Shift Types
  useEffect(() => {
    const loadData = async () => {
      try {
        const deptRes = await getDepartments()
        if (deptRes.success) setDepartments(deptRes.data)

        const shiftRes = await getShiftTypes()
        if (shiftRes.success) setShiftTypes(shiftRes.data)
      } catch (err) {
        toast.error("Error loading data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const downloadBarcode = async (empCode: string) => {
    if (!barcodeRef.current) return

    const canvas = await html2canvas(barcodeRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    })

    const link = document.createElement("a")
    link.download = `employee_${empCode}_barcode.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await createEmployee({
        ...formData,
        hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
      })

      if (res.success && res.data) {
        setGeneratedEmployee(res.data)

        setMessage(`Employee ${res.data.name} added successfully!`)
        setMessageType("success")

        setTimeout(() => downloadBarcode(res.data.empCode), 500)

        setFormData({
          name: "",
          aadhaarNumber: "",
          mobile: "",
          departmentId: "",
          shiftTypeId: "",
          pfId: "",
          esicId: "",
          hourlyRate: "",
        })
      } else {
        setMessage(res.message || "Error adding employee")
        setMessageType("error")
      }
    } catch (err) {
      setMessage("Error adding employee")
      setMessageType("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClear = () => {
    setFormData({
      name: "",
      aadhaarNumber: "",
      mobile: "",
      departmentId: "",
      shiftTypeId: "",
      pfId: "",
      esicId: "",
      hourlyRate: "",
    })
    setGeneratedEmployee(null)
    setMessage("")
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold">Add New Employee</h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Employee Information
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name */}
                <Input
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

                {/* Aadhaar */}
                <Input
                  type="number"
                  placeholder="Aadhaar Number *"
                  value={formData.aadhaarNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aadhaarNumber: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  required
                />

                {/* Mobile */}
                <Input
                  type="number"
                  placeholder="Mobile Number *"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mobile: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  required
                />

                {/* Department */}
                <div>
                  <Label>Department *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, departmentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shift Type from DB */}
                <div>
                  <Label>Shift Type *</Label>
                  <Select
                    value={formData.shiftTypeId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, shiftTypeId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {shiftTypes.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          {shift.name} — {shift.totalHours} Hrs
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hourly Rate */}
                <Input
                  type="number"
                  placeholder="Hourly Rate (₹) *"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourlyRate: e.target.value })
                  }
                  required
                />

                {message && (
                  <Alert variant={messageType === "error" ? "destructive" : "default"}>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" type="submit">
                    {isSubmitting ? "Saving..." : "Add Employee"}
                  </Button>
                  <Button variant="outline" type="button" onClick={handleClear}>
                    <Trash2 className="h-4 w-4" /> Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* EMPLOYEE PREVIEW + BARCODE */}
          {generatedEmployee && (
            <Card className="border-2 border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle>Employee Added!</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <p><strong>Name:</strong> {generatedEmployee.name}</p>
                <p><strong>Emp Code:</strong> {generatedEmployee.empCode}</p>
                <p>
                  <strong>Shift:</strong>{" "}
                  {shiftTypes.find((s) => s.id === generatedEmployee.shiftTypeId)?.name}
                  {" — "}
                  {shiftTypes.find((s) => s.id === generatedEmployee.shiftTypeId)?.totalHours} Hrs
                </p>

                <div
                  ref={barcodeRef}
                  className="bg-white p-4 rounded-lg inline-block"
                >
                  <Barcode
                    value={generatedEmployee.empCode}
                    format="CODE128"
                    width={2}
                    height={100}
                  />
                </div>

                <Button
                  onClick={() => downloadBarcode(generatedEmployee.empCode)}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4" /> Download Barcode
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
