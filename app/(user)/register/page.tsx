"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import UserForm from "@/components/UserForm";
import { registerUser } from "@/actions/register";
import { getDepartments } from "@/actions/department";
import { IDepartment } from "@/lib/models/Department";

export default function RegisterPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔒 No role field at all
  const initialData = {
    username: "",
    password: "",
    departmentId: "",
  };

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await getDepartments();
        if (res.success) {
          setDepartments(res.data);
        } else {
          toast.error(res.message || "Failed to load departments");
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
        toast.error("Something went wrong while loading departments");
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleRegister = async (formData: {
    username: string;
    password: string;
    departmentId: string;
  }) => {
    try {
      const res = await registerUser(formData);

      if (res.success) {
        toast.success("Supervisor registered successfully");
        router.push("/login");
      } else {
        toast.error(res.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600 text-lg">Loading departments...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
          Register Supervisor
        </h2>

        <UserForm
          initialData={initialData}
          onSubmit={handleRegister}
          buttonText="Register Supervisor"
          departments={departments}
        />

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
