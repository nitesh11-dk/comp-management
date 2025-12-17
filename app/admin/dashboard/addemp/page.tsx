"use client";

import React, { useEffect, useRef, useState } from "react";
import Barcode from "react-barcode";
import html2canvas from "html2canvas";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { createEmployee as createEmployeeAction } from "@/actions/employeeActions";
import { getDepartments } from "@/actions/department";
import { getShiftTypes } from "@/actions/shiftType";
import { getCycleTimings } from "@/actions/cycleTimings";

import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download } from "lucide-react";

/* ---------------- ZOD SCHEMA ---------------- */
const employeeSchema = z.object({
  name: z.string().min(3),
  aadhaarNumber: z.string().regex(/^\d{12}$/),
  mobile: z.string().regex(/^\d{10}$/),

  departmentId: z.string().min(1),

  shiftTypeId: z.string().nullable(),
  cycleTimingId: z.string().nullable(),

  pfId: z.string().nullable(),
  pfActive: z.boolean().optional(),

  esicId: z.string().nullable(),
  esicActive: z.boolean().optional(),

  panNumber: z.string().nullable(),

  joinedAt: z.string().min(1),

  dob: z.string().nullable(),
  currentAddress: z.string().nullable(),
  permanentAddress: z.string().nullable(),

  bankAccountNumber: z.string().nullable(),
  ifscCode: z.string().nullable(),

  hourlyRate: z.number().positive(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function AddEmployeePage() {
  const barcodeRef = useRef<HTMLDivElement | null>(null);

  const [departments, setDepartments] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  const [cycleTimings, setCycleTimings] = useState<any[]>([]);

  const [loadingMaster, setLoadingMaster] = useState(true);
  const [generatedEmployee, setGeneratedEmployee] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      aadhaarNumber: "",
      mobile: "",
      joinedAt: "",

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

  /* ---------------- FETCH MASTER DATA ---------------- */
  useEffect(() => {
    (async () => {
      setLoadingMaster(true);

      const [d, s, c] = await Promise.all([
        getDepartments(),
        getShiftTypes(),
        getCycleTimings(),
      ]);

      if (d.success) setDepartments(d.data);
      if (s.success) setShiftTypes(s.data);
      if (c.success) setCycleTimings(c.data);

      setLoadingMaster(false);
    })();
  }, []);

  /* ---------------- BARCODE ---------------- */
  const downloadBarcode = async (code: string) => {
    if (!barcodeRef.current) return;
    const canvas = await html2canvas(barcodeRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.href = canvas.toDataURL();
    link.download = `${code}.png`;
    link.click();
  };

  /* ---------------- SUBMIT ---------------- */
  const onSubmit = async (data: EmployeeFormValues) => {
    setIsSubmitting(true);
    setMessage(null);

    const res = await createEmployeeAction({
      ...data,
      aadhaarNumber: String(data.aadhaarNumber),
      mobile: String(data.mobile),
      hourlyRate: Number(data.hourlyRate),
      dob: data.dob || null,
    });

    if (res.success) {
      setGeneratedEmployee(res.data);
      setMessage("Employee created successfully");
      setMessageType("success");
      reset();
      setTimeout(() => downloadBarcode(res.data.empCode), 300);
    } else {
      setMessage(res.message);
      setMessageType("error");
    }

    setIsSubmitting(false);
  };

  /* ---------------- LOADER ---------------- */
  if (loadingMaster) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-gray-500">
        Loading departments, shift types & cycle timings...
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Add Employee</h1>

      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* BASIC */}
            <InputBlock label="Name" error={errors.name?.message}>
              <Input {...register("name")} />
            </InputBlock>

            <InputBlock label="Aadhaar" error={errors.aadhaarNumber?.message}>
              <Input {...register("aadhaarNumber")} maxLength={12} />
            </InputBlock>

            <InputBlock label="Mobile" error={errors.mobile?.message}>
              <Input {...register("mobile")} maxLength={10} />
            </InputBlock>

            <InputBlock label="Joining Date" error={errors.joinedAt?.message}>
              <Input type="date" {...register("joinedAt")} />
            </InputBlock>

            {/* DEPARTMENT */}
            <SelectBlock
              label="Department"
              name="departmentId"
              control={control}
              items={departments}
            />

            <SelectBlock
              label="Shift Type"
              name="shiftTypeId"
              control={control}
              items={shiftTypes}
              nullable
              render={(s) => `${s.name} (${s.totalHours} hrs)`}
            />

            <SelectBlock
              label="Cycle Timing"
              name="cycleTimingId"
              control={control}
              items={cycleTimings}
              nullable
              render={(c) => `${c.name} (Start ${c.startDay})`}
            />

            {/* PAY */}
            <InputBlock label="Hourly Rate">
              <Input type="number" {...register("hourlyRate", { valueAsNumber: true })} />
            </InputBlock>

{/* DOB */}
<div>
  <Label>Date of Birth</Label>
  <Input type="date" {...register("dob")} />
  {errors.dob && (
    <p className="text-red-600">{errors.dob.message}</p>
  )}
</div>

            {/* IDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input {...register("pfId")} placeholder="PF ID" />
              <Input {...register("esicId")} placeholder="ESIC ID" />
              <Input {...register("panNumber")} placeholder="PAN" />
            </div>

            {/* ADDRESS */}
            <Input {...register("currentAddress")} placeholder="Current Address" />
            <Input {...register("permanentAddress")} placeholder="Permanent Address" />

            {/* BANK */}
            <Input {...register("bankAccountNumber")} placeholder="Bank Account" />
            <Input {...register("ifscCode")} placeholder="IFSC Code" />

            {message && (
              <Alert variant={messageType === "error" ? "destructive" : "default"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : "Create Employee"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generatedEmployee && (
        <Card className="bg-green-50 border-green-500 border">
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

/* ---------------- SMALL HELPERS ---------------- */
function InputBlock({ label, error, children }: any) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}

function SelectBlock({
  label,
  name,
  control,
  items,
  nullable,
  render = (i: any) => i.name,
}: any) {
  return (
    <div>
      <Label>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={field.value ?? "null"}
            onValueChange={(v) => field.onChange(v === "null" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {nullable && <SelectItem value="null">None</SelectItem>}
              {items.map((i: any) => (
                <SelectItem key={i.id} value={i.id}>
                  {render(i)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
