"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

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

    return (
        <div className="flex min-h-screen flex-col bg-gray-100">
            {/* 🔹 Top Navbar */}
            <header className="w-full bg-white shadow-md border-b px-6 py-3 flex justify-between items-center">
                <div className="text-xl font-bold text-indigo-600">Admin Panel</div>
                <div className="flex gap-2">
                    {/* Add Employee Button */}
                    <Link
                        href="/admin/dashboard/addemp"
                        className="py-2 px-4 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
                    >
                        ➕ Add Employee
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    >
                        🚪 Logout
                    </button>
                </div>
            </header>

            {/* 🔹 Content Area */}
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
