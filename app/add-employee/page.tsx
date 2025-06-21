"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { dataStore } from "../../lib/data-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Download, Trash2, ArrowLeft } from "lucide-react"
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
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("success")
  const [generatedEmployee, setGeneratedEmployee] = useState<any>(null)
  const barcodeRef = useRef<HTMLDivElement>(null)

  const departments = dataStore.getDepartments()
  const shifts = dataStore.getShifts()

  const generateEmpCode = () => {
    const randomNum = Math.floor(Math.random() * 9000) + 1000
    return `EMP${randomNum}`
  }

  const downloadBarcode = async (empCode: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate empCode and barcodeId
      const empCode = generateEmpCode()
      const barcodeId = `${empCode}BARCODE`

      const newEmployee = {
        ...formData,
        empCode,
        barcodeId,
        hourlyRate: 100, // Default hourly rate
        profileComplete: true,
      }

      const createdEmployee = dataStore.addEmployee(newEmployee)
      setGeneratedEmployee(createdEmployee)
      setMessage(`Employee ${createdEmployee.name} added successfully! Employee Code: ${empCode}`)
      setMessageType("success")

      // Auto-download barcode after a short delay to ensure rendering
      setTimeout(() => {
        downloadBarcode(empCode)
      }, 500)
    } catch (error) {
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
    })
    setGeneratedEmployee(null)
    setMessage("")
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/")} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add New Employee</h1>
            <p className="text-muted-foreground">Fill in the employee details below</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                  <Input
                    id="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    placeholder="1234-5678-9012"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="9876543210"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
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

                <div className="space-y-2">
                  <Label htmlFor="shiftType">Shift Type *</Label>
                  <Select
                    value={formData.shiftType}
                    onValueChange={(value) => setFormData({ ...formData, shiftType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(shifts).map(([key, shift]) => (
                        <SelectItem key={key} value={key}>
                          {shift.name} ({shift.hours}h)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {message && (
                  <Alert variant={messageType === "error" ? "destructive" : "default"}>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? "Adding Employee..." : "Add Employee"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClear}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Generated Barcode Display */}
          {generatedEmployee && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Employee Added Successfully!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p>
                    <strong>Name:</strong> {generatedEmployee.name}
                  </p>
                  <p>
                    <strong>Employee Code:</strong> {generatedEmployee.empCode}
                  </p>
                  <p>
                    <strong>Department:</strong>{" "}
                    {departments.find((d) => d.id === generatedEmployee.departmentId)?.name}
                  </p>
                </div>

                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-lg inline-block" ref={barcodeRef}>
                    <Barcode
                      value={generatedEmployee.empCode}
                      width={2}
                      height={60}
                      fontSize={14}
                      background="#ffffff"
                      lineColor="#000000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => downloadBarcode(generatedEmployee.empCode)}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Barcode
                    </Button>
                    <p className="text-xs text-green-700">
                      Barcode automatically downloaded. Use this for attendance scanning.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
