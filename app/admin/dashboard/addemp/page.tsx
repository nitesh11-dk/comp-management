"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createEmployee } from "@/actions/employeeActions"
import { getDepartments } from "@/actions/department"

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
    shiftType: "",
    pfId: "",
    esicId: "",
    hourlyRate: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")
  const [generatedEmployee, setGeneratedEmployee] = useState<any>(null)

  const barcodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await getDepartments()
        if (res.success) setDepartments(res.data || [])
        else toast.error(res.message || "⚠️ Failed to load departments")
      } catch (err) {
        console.error("Error fetching departments:", err)
        toast.error("🚨 Error fetching departments")
      } finally {
        setLoading(false)
      }
    }
    fetchDepartments()
  }, [])

  const downloadBarcode = async (empCode: string) => {
    if (!barcodeRef.current) return
    try {
      const canvas = await html2canvas(barcodeRef.current, { backgroundColor: "#ffffff", scale: 2 })
      const link = document.createElement("a")
      link.download = `employee_${empCode}_barcode.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Error downloading barcode:", error)
    }
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

        // Auto-download barcode based on empCode
        setTimeout(() => downloadBarcode(res.data.empCode), 500)

        setFormData({
          name: "",
          aadhaarNumber: "",
          mobile: "",
          departmentId: "",
          shiftType: "",
          pfId: "",
          esicId: "",
          hourlyRate: "",
        })
      } else {
        setMessage(res.message || "Error adding employee")
        setMessageType("error")
      }
    } catch (error) {
      console.error("❌ Error adding employee:", error)
      setMessage("Error adding employee. Please try again.")
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
      shiftType: "",
      pfId: "",
      esicId: "",
      hourlyRate: "",
    })
    setGeneratedEmployee(null)
    setMessage("")
  }

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Add New Employee</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Fill in the employee details below
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" /> Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Aadhaar */}
                <div className="space-y-2">
                  <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                  <Input
                    id="aadhaarNumber"
                    type="number"
                    value={formData.aadhaarNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aadhaarNumber: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="123456789012"
                    required
                  />
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    type="number"
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mobile: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="9876543210"
                    required
                  />
                </div>

                {/* PF & ESIC */}
                <div className="space-y-2">
                  <Label htmlFor="pfId">PF ID (Optional)</Label>
                  <Input
                    id="pfId"
                    value={formData.pfId}
                    onChange={(e) =>
                      setFormData({ ...formData, pfId: e.target.value })
                    }
                    placeholder="Enter PF ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="esicId">ESIC ID (Optional)</Label>
                  <Input
                    id="esicId"
                    value={formData.esicId}
                    onChange={(e) =>
                      setFormData({ ...formData, esicId: e.target.value })
                    }
                    placeholder="Enter ESIC ID"
                  />
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, departmentId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={loading ? "Loading..." : "Select Department"}
                      />
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

                {/* Shift */}
                <div className="space-y-2">
                  <Label htmlFor="shiftType">Shift Type *</Label>
                  <Select
                    value={formData.shiftType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, shiftType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day Shift (8h)</SelectItem>
                      <SelectItem value="night">Night Shift (8h)</SelectItem>
                      <SelectItem value="flexible">Flexible Shift</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hourly Rate */}
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (₹) *</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hourlyRate: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="Enter hourly rate"
                    required
                  />
                </div>

                {message && (
                  <Alert
                    variant={messageType === "error" ? "destructive" : "default"}
                  >
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? "Adding Employee..." : "Add Employee"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="flex-1 sm:flex-none"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Barcode display based on empCode */}
          {generatedEmployee && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 text-base sm:text-lg">
                  Employee Added Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {generatedEmployee.name}
                  </p>
                  <p>
                    <strong>Emp Code:</strong> {generatedEmployee.empCode}
                  </p>
                  <p>
                    <strong>Department:</strong>{" "}
                    {
                      departments.find((d) => d.id === generatedEmployee.departmentId)?.name
                    }
                  </p>
                  {generatedEmployee.pfId && (
                    <p>
                      <strong>PF ID:</strong> {generatedEmployee.pfId}
                    </p>
                  )}
                  {generatedEmployee.esicId && (
                    <p>
                      <strong>ESIC ID:</strong> {generatedEmployee.esicId}
                    </p>
                  )}
                  <p>
                    <strong>Hourly Rate:</strong> ₹{generatedEmployee.hourlyRate}
                  </p>
                </div>

                <div className="text-center space-y-3 sm:space-y-4">
                  <div
                    className="bg-white p-3 sm:p-4 rounded-lg inline-block"
                    ref={barcodeRef}
                  >
                    <Barcode
                      value={generatedEmployee.empCode} // ✅ Use empCode for barcode
                      format="CODE128"
                      width={2}
                      height={100}
                      fontSize={16}
                      displayValue={true}
                      background="#ffffff"
                      lineColor="#000000"
                      margin={10}
                    />
                  </div>

                  <Button
                    onClick={() => downloadBarcode(generatedEmployee.empCode)}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download Barcode
                  </Button>
                  <p className="text-xs text-green-700">
                    Barcode automatically generated from Emp Code. Use this for
                    attendance scanning.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
