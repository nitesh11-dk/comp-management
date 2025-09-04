"use client";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUserDepartment } from "@/actions/department";
import { IDepartment } from "@/lib/models/Department";

interface SupervisorLayoutProps {
    children: React.ReactNode;
}

export default function SupervisorLayout({ children }: SupervisorLayoutProps) {
    const router = useRouter();
    const [department, setDepartment] = useState<IDepartment | null>(null);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            toast.success("✅ Logged out successfully");
            router.push("/login");
        } catch (err) {
            console.error("Logout error:", err);
            toast.error("❌ Failed to logout");
        }
    };

    useEffect(() => {
        const fetchDepartment = async () => {
            try {
                const res = await getCurrentUserDepartment();
                if (res.success && res.data) {
                    setDepartment(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch department:", err);
            }
        };

        fetchDepartment();
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-gray-100">
            {/* Top Navbar */}
            <header className="w-full bg-white shadow-md border-b px-4 sm:px-6 py-3 flex justify-between items-center">
                {/* Left: Department Name */}
                <div className="text-lg font-semibold text-indigo-600">
                    Department: {department?.name || "Loading..."}
                </div>

                {/* Right: History & Logout */}
                <div className="flex items-center gap-2">
                    {/* History Button */}
                    <button
                        onClick={() => router.push("/dashboard/history")}
                        className="flex items-center gap-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">History</span> {/* hidden on mobile */}
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                        🚪 Logout
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
        </div>
    );
}
