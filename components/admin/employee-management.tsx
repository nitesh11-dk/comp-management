"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { dataStore } from "../../lib/data-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, Download } from "lucide-react"
import Barcode from "react-barcode"
import html2canvas from "html2canvas"

interface Employee {
  id: string
  name: string
  empCode: string
  pfId: string
  esicId: string
  aadhaarNumber: string
  mobile: string
  departmentId: string
  shiftType: string
  barcodeId: string
  hourlyRate: number
  profileComplete: boolean
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [shifts, setShifts] = useState<any>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<Partial<Employee>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setEmployees(dataStore.getEmployees())
    setDepartments(dataStore.getDepartments())
    setShifts(dataStore.getShifts())
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empCode.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingEmployee) {
      dataStore.updateEmployee(editingEmployee.id, formData)
    } else {
      const newEmployee = {
        ...formData,
        barcodeId: `${formData.empCode}BARCODE`,
        profileComplete: true,
      } as Employee
      dataStore.addEmployee(newEmployee)
    }

    loadData()
    setIsDialogOpen(false)
    setEditingEmployee(null)
    setFormData({})
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData(employee)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      dataStore.deleteEmployee(id)
      loadData()
    }
  }

  const getDepartmentName = (id: string) => {
    return departments.find((dept) => dept.id === id)?.name || "Unknown"
  }

  const getShiftName = (id: string) => {
    return shifts[id]?.name || "Unknown"
  }

  const downloadEmployeeBarcode = async (empCode: string) => {
    // Create a temporary div with barcode
    const tempDiv = document.createElement("div")
    tempDiv.style.position = "absolute"
    tempDiv.style.left = "-9999px"
    tempDiv.innerHTML = `<div style="background: white; padding: 20px;">
      <svg id="temp-barcode"></svg>
    </div>`
    document.body.appendChild(tempDiv)

    // Generate barcode using JsBarcode
    const JsBarcode = require("jsbarcode")
    JsBarcode("#temp-barcode", empCode, {
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
      link.download = `employee_${empCode}_barcode.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Error downloading barcode:", error)
    } finally {
      document.body.removeChild(tempDiv)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingEmployee(null)
                setFormData({})
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="empCode">Employee Code</Label>
                  <Input
                    id="empCode"
                    value={formData.empCode || ""}
                    onChange={(e) => setFormData({ ...formData, empCode: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pfId">PF ID</Label>
                  <Input
                    id="pfId"
                    value={formData.pfId || ""}
                    onChange={(e) => setFormData({ ...formData, pfId: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="esicId">ESIC ID</Label>
                  <Input
                    id="esicId"
                    value={formData.esicId || ""}
                    onChange={(e) => setFormData({ ...formData, esicId: e.target.value })}
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
                  <Label htmlFor="departmentId">Department</Label>
                  <Select
                    value={formData.departmentId || ""}
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
                  <Label htmlFor="shiftType">Shift Type</Label>
                  <Select
                    value={formData.shiftType || ""}
                    onValueChange={(value) => setFormData({ ...formData, shiftType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(shifts).map(([key, shift]) => (
                        <SelectItem key={key} value={key}>
                          {shift.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate || ""}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingEmployee ? "Update" : "Create"} Employee</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Rate/Hr</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.empCode}</TableCell>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{getDepartmentName(employee.departmentId)}</TableCell>
                  <TableCell>{getShiftName(employee.shiftType)}</TableCell>
                  <TableCell>{employee.mobile}</TableCell>
                  <TableCell>₹{employee.hourlyRate}</TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="w-24">
                        <Barcode value={employee.empCode} width={1} height={30} fontSize={10} />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadEmployeeBarcode(employee.empCode)}
                        className="w-full text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.profileComplete ? "default" : "secondary"}>
                      {employee.profileComplete ? "Complete" : "Incomplete"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(employee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(employee.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
