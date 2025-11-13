"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateEmployee, getEmployeeById } from "@/actions/employeeActions";
import { getDepartments } from "@/actions/department";
import { getShiftTypes } from "@/actions/shiftType";
import { getCycleTimings } from "@/actions/cycleTimings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Trash2 } from "lucide-react";

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const employeeId = params.id;

    const [departments, setDepartments] = useState<any[]>([]);
    const [shiftTypes, setShiftTypes] = useState<any[]>([]);
    const [cycleTimings, setCycleTimings] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    const [formData, setFormData] = useState({
        name: "",
        aadhaarNumber: "",
        mobile: "",
        departmentId: "",
        shiftTypeId: null as string | null,
        cycleTimingId: null as string | null,
        pfId: "",
        pfActive: true,
        esicId: "",
        esicActive: true,
        panNumber: "",
        dob: "",
        currentAddress: "",
        permanentAddress: "",
        bankAccountNumber: "",
        ifscCode: "",
        hourlyRate: "",
    });

    // ------------------ LOAD EMPLOYEE ------------------
    useEffect(() => {
        if (!employeeId) return;

        const load = async () => {
            try {
                const [deptRes, shiftRes, cycleRes, empRes] = await Promise.all([
                    getDepartments(),
                    getShiftTypes(),
                    getCycleTimings(),
                    getEmployeeById(employeeId),
                ]);

                if (deptRes.success) setDepartments(deptRes.data);
                if (shiftRes.success) setShiftTypes(shiftRes.data);
                if (cycleRes.success) setCycleTimings(cycleRes.data);

                if (empRes.success && empRes.data) {
                    const emp = empRes.data;

                    setFormData({
                        name: emp.name,
                        aadhaarNumber: emp.aadhaarNumber,
                        mobile: emp.mobile,
                        departmentId: emp.departmentId,
                        shiftTypeId: emp.shiftTypeId ?? null,
                        cycleTimingId: emp.cycleTimingId ?? null,
                        pfId: emp.pfId || "",
                        pfActive: emp.pfActive,
                        esicId: emp.esicId || "",
                        esicActive: emp.esicActive,
                        panNumber: emp.panNumber || "",
                        dob: emp.dob ? emp.dob.split("T")[0] : "",
                        currentAddress: emp.currentAddress || "",
                        permanentAddress: emp.permanentAddress || "",
                        bankAccountNumber: emp.bankAccountNumber || "",
                        ifscCode: emp.ifscCode || "",
                        hourlyRate: String(emp.hourlyRate),
                    });
                }
            } catch (error) {
                toast.error("Error loading employee");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [employeeId]);

    // ------------------ SUBMIT ------------------
    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                hourlyRate: Number(formData.hourlyRate),
                dob: formData.dob ? new Date(formData.dob) : null,
                shiftTypeId: formData.shiftTypeId,
                cycleTimingId: formData.cycleTimingId,
            };

            const res = await updateEmployee(employeeId, payload);

            if (res.success) {
                setMessage("Employee updated successfully");
                setMessageType("success");
            } else {
                setMessage(res.message || "Update failed");
                setMessageType("error");
            }
        } catch (err) {
            setMessage("Unexpected error");
            setMessageType("error");
        }

        setIsSubmitting(false);
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto space-y-6">

                <Button variant="outline" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4" /> Back
                </Button>

                <h1 className="text-2xl font-bold">Edit Employee</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Employee Details</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit}>

                            {/* BASIC INFO */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <InputField label="Name" value={formData.name}
                                    onChange={(v) => setFormData({ ...formData, name: v })} />

                                <InputField label="Aadhaar" value={formData.aadhaarNumber}
                                    onChange={(v) => setFormData({ ...formData, aadhaarNumber: v })} />

                                <InputField label="Mobile" value={formData.mobile}
                                    onChange={(v) => setFormData({ ...formData, mobile: v })} />

                                <InputField label="PAN" value={formData.panNumber}
                                    onChange={(v) => setFormData({ ...formData, panNumber: v })} />

                                <InputField type="date" label="DOB" value={formData.dob}
                                    onChange={(v) => setFormData({ ...formData, dob: v })} />

                                <InputField label="Current Address" value={formData.currentAddress}
                                    onChange={(v) => setFormData({ ...formData, currentAddress: v })} />

                                <InputField label="Permanent Address" value={formData.permanentAddress}
                                    onChange={(v) => setFormData({ ...formData, permanentAddress: v })} />

                                <InputField label="Bank Account No." value={formData.bankAccountNumber}
                                    onChange={(v) => setFormData({ ...formData, bankAccountNumber: v })} />

                                <InputField label="IFSC Code" value={formData.ifscCode}
                                    onChange={(v) => setFormData({ ...formData, ifscCode: v })} />

                            </div>

                            {/* PF / ESIC */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                                <div>
                                    <Label>PF ID</Label>
                                    <Input value={formData.pfId}
                                        onChange={(e) => setFormData({ ...formData, pfId: e.target.value })} />
                                    <div className="flex items-center mt-2">
                                        <Switch checked={formData.pfActive}
                                            onCheckedChange={(v) => setFormData({ ...formData, pfActive: v })} />
                                        <span className="ml-2 text-sm">PF Active</span>
                                    </div>
                                </div>

                                <div>
                                    <Label>ESIC ID</Label>
                                    <Input value={formData.esicId}
                                        onChange={(e) => setFormData({ ...formData, esicId: e.target.value })} />
                                    <div className="flex items-center mt-2">
                                        <Switch checked={formData.esicActive}
                                            onCheckedChange={(v) => setFormData({ ...formData, esicActive: v })} />
                                        <span className="ml-2 text-sm">ESIC Active</span>
                                    </div>
                                </div>
                            </div>

                            {/* Department Select */}
                            <SelectField
                                label="Department"
                                value={formData.departmentId}
                                items={departments}
                                onChange={(v) => setFormData({ ...formData, departmentId: v })}
                                display={(x) => x.name}
                            />

                            {/* Shift Select */}
                            <SelectField
                                label="Shift Type"
                                value={formData.shiftTypeId ?? "null"}
                                items={shiftTypes}
                                onChange={(v) => setFormData({ ...formData, shiftTypeId: v === "null" ? null : v })}
                                display={(x) => `${x.name} — ${x.totalHours} hrs`}
                                allowNull
                            />

                            {/* Cycle Select */}
                            <SelectField
                                label="Cycle Timing"
                                value={formData.cycleTimingId ?? "null"}
                                items={cycleTimings}
                                onChange={(v) => setFormData({ ...formData, cycleTimingId: v === "null" ? null : v })}
                                display={(c) => `${c.name} (Start: ${c.startDay})`}
                                allowNull
                            />

                            {/* Hourly Rate */}
                            <InputField
                                label="Hourly Rate"
                                type="number"
                                value={formData.hourlyRate}
                                onChange={(v) => setFormData({ ...formData, hourlyRate: v })}
                            />

                            {/* ALERT */}
                            {message && (
                                <Alert variant={messageType === "error" ? "destructive" : "default"}>
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-2">
                                <Button className="flex-1" disabled={isSubmitting}>
                                    {isSubmitting ? "Updating..." : "Update"}
                                </Button>

                                <Button type="button" variant="outline"
                                    onClick={() => window.location.reload()}>
                                    <Trash2 className="w-4 h-4" /> Reset
                                </Button>
                            </div>

                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

/* ------------------ Input Field Component ------------------ */
function InputField({ label, value, onChange, type = "text" }: any) {
    return (
        <div>
            <Label>{label}</Label>
            <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}

/* ------------------ Select Field Component ------------------ */
function SelectField({ label, value, items, onChange, display, allowNull }: any) {
    return (
        <div>
            <Label>{label}</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder={"Select " + label} />
                </SelectTrigger>
                <SelectContent>
                    {allowNull && <SelectItem value="null">None</SelectItem>}
                    {items.map((item: any) => (
                        <SelectItem key={item.id} value={item.id}>
                            {display(item)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
