"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { createEmployee as createEmployeeAction } from "@/actions/employeeActions";
import { getDepartments } from "@/actions/department";
import { getShiftTypes } from "@/actions/shiftType";
import { getCycleTimings } from "@/actions/cycleTimings";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download } from "lucide-react";

/* ---------------- Zod schema ---------------- */
const employeeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),

  departmentId: z.string().min(1, "Department required"),

  shiftTypeId: z.string().nullable().optional(),
  cycleTimingId: z.string().nullable().optional(),

  pfId: z.string().nullable().optional(),
  pfActive: z.boolean().optional().default(true),

  esicId: z.string().nullable().optional(),
  esicActive: z.boolean().optional().default(true),

  panNumber: z.string().nullable().optional(),

  dob: z.string().nullable().optional(),
  currentAddress: z.string().nullable().optional(),
  permanentAddress: z.string().nullable().optional(),

  bankAccountNumber: z.string().nullable().optional(),
  ifscCode: z.string().nullable().optional(),

  hourlyRate: z.number({ invalid_type_error: "Hourly rate required" }).positive("Hourly rate must be > 0"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function AddEmployeePage() {
  const barcodeRef = useRef<HTMLDivElement | null>(null);

  const [departments, setDepartments] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  const [cycleTimings, setCycleTimings] = useState<any[]>([]);

  const [generatedEmployee, setGeneratedEmployee] = useState<any | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      aadhaarNumber: "",
      mobile: "",
      departmentId: "",
      shiftTypeId: null,
      cycleTimingId: null,
      pfId: null,
      pfActive: true,
      esicId: null,
      esicActive: true,
      panNumber: null,
      dob: null,
      currentAddress: null,
      permanentAddress: null,
      bankAccountNumber: null,
      ifscCode: null,
      hourlyRate: 0,
    },
  });

  /* ---------------- Fetch master data ---------------- */
  useEffect(() => {
    (async () => {
      const d = await getDepartments();
      const s = await getShiftTypes();
      const c = await getCycleTimings();

      if (d.success) setDepartments(d.data);
      if (s.success) setShiftTypes(s.data);
      if (c.success) setCycleTimings(c.data);
    })();
  }, []);

  /* ---------------- Download Barcode ---------------- */
  const downloadBarcode = async (empCode: string) => {
    if (!barcodeRef.current) return;

    const canvas = await html2canvas(barcodeRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = `${empCode}_barcode.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  /* ---------------- Submit Handler ---------------- */
  const onSubmit = async (data: EmployeeFormValues) => {
    setIsSubmitting(true);
    setMessage(null);

    const payload = {
      ...data,
      aadhaarNumber: String(data.aadhaarNumber),
      mobile: String(data.mobile),
      hourlyRate: Number(data.hourlyRate),
      dob: data.dob || null,
    };

    const res = await createEmployeeAction(payload);

    if (res.success) {
      setGeneratedEmployee(res.data);
      setMessage("Employee created successfully!");
      setMessageType("success");
      reset();

      // Auto download after a short delay
      setTimeout(() => downloadBarcode(res.data.empCode), 400);
    } else {
      setMessage(res.message);
      setMessageType("error");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Add Employee</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add Employee</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Name */}
            <div>
              <Label>Name</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-red-600">{errors.name.message}</p>}
            </div>

            {/* Aadhaar */}
            <div>
              <Label>Aadhaar</Label>
              <Input {...register("aadhaarNumber")} maxLength={12} />
              {errors.aadhaarNumber && <p className="text-red-600">{errors.aadhaarNumber.message}</p>}
            </div>

            {/* Mobile */}
            <div>
              <Label>Mobile</Label>
              <Input {...register("mobile")} maxLength={10} />
              {errors.mobile && <p className="text-red-600">{errors.mobile.message}</p>}
            </div>

            {/* Department */}
            <div>
              <Label>Department</Label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.departmentId && <p className="text-red-600">{errors.departmentId.message}</p>}
            </div>

            {/* Shift Type */}
            <div>
              <Label>Shift Type</Label>
              <Controller
                name="shiftTypeId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "null"}
                    onValueChange={(v) => field.onChange(v === "null" ? null : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">None</SelectItem>

                      {shiftTypes.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.totalHours} hrs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Cycle Timing */}
            <div>
              <Label>Cycle Timing</Label>
              <Controller
                name="cycleTimingId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "null"}
                    onValueChange={(v) => field.onChange(v === "null" ? null : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select cycle timing" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">None</SelectItem>

                      {cycleTimings.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} (Start: {c.startDay})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Hourly Rate */}
            <div>
              <Label>Hourly Rate</Label>
              <Input
                type="number"
                step="0.01"
                {...register("hourlyRate", { valueAsNumber: true })}
              />
              {errors.hourlyRate && <p className="text-red-600">{errors.hourlyRate.message}</p>}
            </div>

            {/* IDs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <Label>PF ID</Label>
                <Input {...register("pfId")} />
              </div>

              <div>
                <Label>ESIC ID</Label>
                <Input {...register("esicId")} />
              </div>

              <div>
                <Label>PAN Number</Label>
                <Input {...register("panNumber")} />
              </div>
            </div>

            {/* DOB */}
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" {...register("dob")} />
            </div>

            {/* Address */}
            <div>
              <Label>Current Address</Label>
              <Input {...register("currentAddress")} />
            </div>

            <div>
              <Label>Permanent Address</Label>
              <Input {...register("permanentAddress")} />
            </div>

            {/* Bank */}
            <div>
              <Label>Bank Account Number</Label>
              <Input {...register("bankAccountNumber")} />
            </div>

            <div>
              <Label>IFSC Code</Label>
              <Input {...register("ifscCode")} />
            </div>

            {/* Message */}
            {message && (
              <Alert variant={messageType === "error" ? "destructive" : "default"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : "Add Employee"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* SUCCESS CARD */}
      {generatedEmployee && (
        <Card className="border-green-500 border bg-green-50">
          <CardHeader>
            <CardTitle>Employee Created</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <p><b>Name:</b> {generatedEmployee.name}</p>
            <p><b>Code:</b> {generatedEmployee.empCode}</p>

            <div ref={barcodeRef} className="inline-block bg-white p-4">
              <Barcode value={generatedEmployee.empCode} />
            </div>

            <Button onClick={() => downloadBarcode(generatedEmployee.empCode)}>
              <Download /> Download Barcode
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
