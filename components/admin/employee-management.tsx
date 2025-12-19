"use client";

import { useState, useEffect, useRef } from "react";
import { getEmployees } from "@/actions/employeeActions";
import { getDepartments } from "@/actions/department";
import { Button } from "@/components/ui/button";
import { Download, Eye, Edit } from "lucide-react";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";
import { useRouter } from "next/navigation";

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchField, setSearchField] = useState("name");
  const [searchValue, setSearchValue] = useState("");

  // 🔑 map of refs (same pattern as AddEmployee but per employee)
  const barcodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const router = useRouter();

  // -----------------------------------------
  // Fetch employees + departments
  // -----------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await getEmployees();
        const depRes = await getDepartments();

        if (empRes.success) {
          setEmployees(empRes.data);
          setFilteredEmployees(empRes.data);
        }

        if (depRes.success) setDepartments(depRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  // -----------------------------------------
  // Search filter
  // -----------------------------------------
  useEffect(() => {
    const value = searchValue.toLowerCase();

    const filtered = employees.filter((emp) => {
      switch (searchField) {
        case "name":
        case "empCode":
        case "pfId":
        case "esicId":
        case "aadhaarNumber":
        case "mobile":
          return String(emp[searchField] || "")
            .toLowerCase()
            .includes(value);
        default:
          return true;
      }
    });

    setFilteredEmployees(filtered);
  }, [searchField, searchValue, employees]);

  // -----------------------------------------
  // Download barcode (SAME LOGIC AS AddEmployee)
  // -----------------------------------------
  const downloadBarcode = async (empId: string, empCode: string) => {
    const el = barcodeRefs.current[empId];
    if (!el) return;

    // 🔥 wait for DOM paint
    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `${empCode}_barcode.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="w-full sm:px-4">
      <h2 className="text-xl font-bold mb-4">Employee Management</h2>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center w-full">
        <select
          className="border rounded px-3 py-2 w-full sm:w-auto text-sm"
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
        >
          <option value="name">Name</option>
          <option value="empCode">Emp Code</option>
          <option value="pfId">PF ID</option>
          <option value="esicId">ESIC ID</option>
          <option value="aadhaarNumber">Aadhaar Number</option>
          <option value="mobile">Mobile</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-3 py-2 flex-1 text-sm"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded shadow-sm max-h-[70vh]">
        <table className="min-w-[600px] w-full table-auto border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="p-2 border-b text-left">Name</th>
              <th className="p-2 border-b text-left">Mobile</th>
              <th className="p-2 border-b text-left">PF ID</th>
              <th className="p-2 border-b text-left">ESIC ID</th>
              <th className="p-2 border-b text-left">Aadhaar</th>
              <th className="p-2 border-b text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4">
                  No employees found
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="p-2 border-b">{emp.name}</td>
                  <td className="p-2 border-b">{emp.mobile}</td>
                  <td className="p-2 border-b">{emp.pfId || "-"}</td>
                  <td className="p-2 border-b">{emp.esicId || "-"}</td>
                  <td className="p-2 border-b">{emp.aadhaarNumber || "-"}</td>

                  <td className="p-2 border-b flex flex-wrap gap-2">
                    {/* 🔥 OFFSCREEN BARCODE (CRITICAL FIX) */}
                    <div
                      ref={(el) => (barcodeRefs.current[emp.id] = el)}
                      className="absolute -left-[9999px] top-0 bg-white p-4"
                    >
                      <Barcode
                        value={emp.empCode}
                        renderer="canvas" // 🔥 MUST
                      />
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadBarcode(emp.id, emp.empCode)
                      }
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Barcode
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/admin/dashboard/employee/${emp.id}`
                        )
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
