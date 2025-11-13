"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateEmployee, getEmployeeById } from "@/actions/employeeActions";
import { getDepartments } from "@/actions/department";
import { getShiftTypes } from "@/actions/shiftType";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, ChevronLeft } from "lucide-react";

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const employeeId = params.id;

    const [formData, setFormData] = useState({
        name: "",
        aadhaarNumber: "",
        mobile: "",
        departmentId: "",
        shiftTypeId: "",
        pfId: "",
        esicId: "",
        hourlyRate: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [departments, setDepartments] = useState<any[]>([]);
    const [shiftTypes, setShiftTypes] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    const [employee, setEmployee] = useState<any>(null);

    useEffect(() => {
        if (!employeeId) return;

        const loadData = async () => {
            try {
                const [deptRes, shiftRes, empRes] = await Promise.all([
                    getDepartments(),
                    getShiftTypes(),
                    getEmployeeById(employeeId),
                ]);

                if (deptRes.success) setDepartments(deptRes.data);
                else toast.error("Failed to load departments");

                if (shiftRes.success) setShiftTypes(shiftRes.data);
                else toast.error("Failed to load shifts");

                if (empRes.success && empRes.data) {
                    const emp = empRes.data;
                    setEmployee(emp);

                    setFormData({
                        name: emp.name,
                        aadhaarNumber: emp.aadhaarNumber,
                        mobile: emp.mobile,
                        departmentId: emp.departmentId,
                        shiftTypeId: emp.shiftTypeId,
                        pfId: emp.pfId || "",
                        esicId: emp.esicId || "",
                        hourlyRate: String(emp.hourlyRate),
                    });
                } else {
                    toast.error("Employee not found");
                    router.back();
                }
            } catch (err) {
                toast.error("Error loading data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [employeeId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId) return;

        setIsSubmitting(true);

        try {
            const res = await updateEmployee(employeeId, {
                ...formData,
                hourlyRate: Number(formData.hourlyRate),
            });

            if (res.success) {
                setMessage("Employee updated successfully!");
                setMessageType("success");
            } else {
                setMessage(res.message || "Update failed");
                setMessageType("error");
            }
        } catch (err) {
            setMessage("Error updating employee");
            setMessageType("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        if (!employee) return;

        setFormData({
            name: employee.name,
            aadhaarNumber: employee.aadhaarNumber,
            mobile: employee.mobile,
            departmentId: employee.departmentId,
            shiftTypeId: employee.shiftTypeId,
            pfId: employee.pfId || "",
            esicId: employee.esicId || "",
            hourlyRate: String(employee.hourlyRate),
        });

        setMessage("");
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex items-center gap-2"
                >
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>

                <h1 className="text-2xl font-bold">Edit Employee</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Employee Details</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <Label>Full Name *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            {/* Aadhaar */}
                            <div>
                                <Label>Aadhaar *</Label>
                                <Input
                                    value={formData.aadhaarNumber}
                                    onChange={(e) =>
                                        setFormData({ ...formData, aadhaarNumber: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            {/* Mobile */}
                            <div>
                                <Label>Mobile *</Label>
                                <Input
                                    value={formData.mobile}
                                    onChange={(e) =>
                                        setFormData({ ...formData, mobile: e.target.value })
                                    }
                                    required
                                />
                            </div>

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
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Shift Type */}
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
                            <div>
                                <Label>Hourly Rate *</Label>
                                <Input
                                    type="number"
                                    value={formData.hourlyRate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, hourlyRate: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            {/* Alerts */}
                            {message && (
                                <Alert
                                    variant={messageType === "error" ? "destructive" : "default"}
                                >
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-2">
                                <Button type="submit" disabled={isSubmitting} className="flex-1">
                                    {isSubmitting ? "Updating..." : "Update Employee"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleReset}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
