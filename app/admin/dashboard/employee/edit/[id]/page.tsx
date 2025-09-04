"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateEmployee, getEmployeeById } from "@/actions/employeeActions";
import { getDepartments } from "@/actions/department";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, ChevronLeft } from "lucide-react";

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const employeeId = params.id; // ✅ get id from URL path

    const [formData, setFormData] = useState({
        name: "",
        aadhaarNumber: "",
        mobile: "",
        departmentId: "",
        shiftType: "",
        pfId: "",
        esicId: "",
        hourlyRate: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");
    const [employee, setEmployee] = useState<any>(null);

    useEffect(() => {
        if (!employeeId) return;

        const fetchData = async () => {
            try {
                const [deptRes, empRes] = await Promise.all([
                    getDepartments(),
                    getEmployeeById(employeeId),
                ]);

                if (deptRes.success) setDepartments(deptRes.data || []);
                else toast.error(deptRes.message || "Failed to load departments");

                if (empRes.success && empRes.data) {
                    setEmployee(empRes.data);
                    setFormData({
                        name: empRes.data.name,
                        aadhaarNumber: empRes.data.aadhaarNumber,
                        mobile: empRes.data.mobile,
                        departmentId: empRes.data.departmentId,
                        shiftType: empRes.data.shiftType,
                        pfId: empRes.data.pfId || "",
                        esicId: empRes.data.esicId || "",
                        hourlyRate: String(empRes.data.hourlyRate),
                    });
                } else {
                    toast.error(empRes.message || "Employee not found");
                    router.back();
                }
            } catch (error) {
                console.error(error);
                toast.error("Error fetching data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

            if (res.success && res.data) {
                setEmployee(res.data);
                setMessage(`Employee ${res.data.name} updated successfully!`);
                setMessageType("success");
            } else {
                setMessage(res.message || "Error updating employee");
                setMessageType("error");
            }
        } catch (error) {
            console.error(error);
            setMessage("Error updating employee. Please try again.");
            setMessageType("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClear = () => {
        if (employee) {
            setFormData({
                name: employee.name,
                aadhaarNumber: employee.aadhaarNumber,
                mobile: employee.mobile,
                departmentId: employee.departmentId,
                shiftType: employee.shiftType,
                pfId: employee.pfId || "",
                esicId: employee.esicId || "",
                hourlyRate: String(employee.hourlyRate),
            });
        }
        setMessage("");
    };

    if (!employeeId) return <div className="p-6">Employee ID missing in URL</div>;
    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="min-h-screen bg-background p-2 sm:p-4">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => router.back()}
                >
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>

                <h1 className="text-xl sm:text-2xl font-bold">Edit Employee</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Update employee details below</p>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base sm:text-lg">Employee Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Aadhaar */}
                            <div className="space-y-2">
                                <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                                <Input
                                    id="aadhaarNumber"
                                    value={formData.aadhaarNumber}
                                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Mobile */}
                            <div className="space-y-2">
                                <Label htmlFor="mobile">Mobile Number *</Label>
                                <Input
                                    id="mobile"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    required
                                />
                            </div>

                            {/* PF & ESIC */}
                            <div className="space-y-2">
                                <Label htmlFor="pfId">PF ID (Optional)</Label>
                                <Input
                                    id="pfId"
                                    value={formData.pfId}
                                    onChange={(e) => setFormData({ ...formData, pfId: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="esicId">ESIC ID (Optional)</Label>
                                <Input
                                    id="esicId"
                                    value={formData.esicId}
                                    onChange={(e) => setFormData({ ...formData, esicId: e.target.value })}
                                />
                            </div>

                            {/* Department */}
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
                                            <SelectItem key={dept._id} value={dept._id}>
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
                                    onValueChange={(value) => setFormData({ ...formData, shiftType: value })}
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
                                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                    required
                                />
                            </div>

                            {message && (
                                <Alert variant={messageType === "error" ? "destructive" : "default"}>
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                    {isSubmitting ? "Updating..." : "Update Employee"}
                                </Button>
                                <Button type="button" variant="outline" onClick={handleClear} className="flex-1 sm:flex-none">
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
