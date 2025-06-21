"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { dataStore } from "../../lib/data-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, Download, Eye } from "lucide-react"
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
  const router = useRouter()
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

  const handleViewDetails = (employeeId: string) => {
    router.push(`/admin/employee/${employeeId}`)
  }

  const getDepartmentName = (id: string) => {
    return departments.find((dept) => dept.id === id)?.name || "Unknown"
  }

  const getShiftName = (id: string) => {
    return shifts[id]?.name || "Unknown"
  }

  const downloadEmployeeBarcode = async (empCode: string) => {
    const tempDiv = document.createElement("div")
    tempDiv.style.position = "absolute"
    tempDiv.style.left = "-9999px"
    tempDiv.innerHTML = `<div style="background: white; padding: 20px;">
      <svg id="temp-barcode"></svg>
    </div>`
    document.body.appendChild(tempDiv)

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Employee Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingEmployee(null)
                setFormData({})
              }}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Employee Code</TableHead>
                  <TableHead className="min-w-[120px]">Name</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">Department</TableHead>
                  <TableHead className="min-w-[80px] hidden md:table-cell">Shift</TableHead>
                  <TableHead className="min-w-[100px] hidden lg:table-cell">Mobile</TableHead>
                  <TableHead className="min-w-[80px] hidden lg:table-cell">Rate/Hr</TableHead>
                  <TableHead className="min-w-[120px] hidden xl:table-cell">Barcode</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.empCode}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {getDepartmentName(employee.departmentId)} • ₹{employee.hourlyRate}/hr
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{getDepartmentName(employee.departmentId)}</TableCell>
                    <TableCell className="hidden md:table-cell">{getShiftName(employee.shiftType)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{employee.mobile}</TableCell>
                    <TableCell className="hidden lg:table-cell">₹{employee.hourlyRate}</TableCell>
                    <TableCell className="hidden xl:table-cell">
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
                      <Badge variant={employee.profileComplete ? "default" : "secondary"} className="text-xs">
                        {employee.profileComplete ? "Complete" : "Incomplete"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(employee.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(employee)}
                          className="hidden sm:inline-flex"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(employee.id)}
                          className="hidden sm:inline-flex"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
