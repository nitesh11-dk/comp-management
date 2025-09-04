"use client"

import { useState, useEffect, useRef } from "react"
import { getEmployees } from "@/actions/employeeActions"
import { getDepartments } from "@/actions/department"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, Edit, Trash2 } from "lucide-react"
import Barcode from "react-barcode"
import html2canvas from "html2canvas"
import { useRouter } from "next/navigation"

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const barcodeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const router = useRouter()

  // Fetch employees and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await getEmployees()
        const depRes = await getDepartments()
        if (empRes.success) setEmployees(empRes.data)
        if (depRes.success) setDepartments(depRes.data)
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [])

  const getDepartmentName = (id: string) => {
    return departments.find((dep) => dep._id === id)?.name || "Unknown"
  }

  const downloadBarcode = async (empId: string, empCode: string) => {
    const barcodeDiv = barcodeRefs.current[empId]
    if (!barcodeDiv) return
    try {
      const canvas = await html2canvas(barcodeDiv, { backgroundColor: "#ffffff", scale: 2 })
      const link = document.createElement("a")
      link.download = `employee_${empCode}_barcode.png` // Use empCode in filename
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Error downloading barcode:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">Employee Management</h2>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Department</TableHead>
                <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{getDepartmentName(emp.departmentId)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{emp.mobile}</TableCell>
                  <TableCell>
                    <div ref={(el) => (barcodeRefs.current[emp._id] = el)}>
                      <Barcode value={emp.empCode} width={2} height={60} fontSize={12} />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1"
                      onClick={() => downloadBarcode(emp._id, emp.empCode)} // Pass empCode
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.profileComplete ? "default" : "secondary"} className="text-xs">
                      {emp.profileComplete ? "Complete" : "Incomplete"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/dashboard/employee/${emp._id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hidden sm:inline-flex"
                        onClick={() => router.push(`/admin/dashboard/employee/edit/${emp._id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="hidden sm:inline-flex">
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
  )
}
