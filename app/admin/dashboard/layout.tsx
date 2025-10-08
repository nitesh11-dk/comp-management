"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    // Close menu if clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-gray-100">
            {/* 🔹 Top Navbar */}
            <header className="w-full bg-white shadow-md border-b px-6 py-3 flex justify-between items-center relative">
                <div className="text-xl font-bold text-indigo-600">Admin Panel</div>

                {/* Desktop Menu */}
                <div className="hidden sm:flex gap-2">
                    <Link
                        href="/admin/dashboard/addemp"
                        className="py-2 px-4 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
                    >
                        ➕ Add Employee
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    >
                        🚪 Logout
                    </button>
                </div>

                {/* Mobile Hamburger */}
                <button
                    className="sm:hidden p-2 rounded-md bg-gray-200 hover:bg-gray-300 transition"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div
                        ref={menuRef}
                        className="absolute right-6 top-full mt-2 w-48 bg-white border rounded-md shadow-md flex flex-col z-20 sm:hidden"
                    >
                        <Link
                            href="/admin/dashboard/addemp"
                            className="px-4 py-2 hover:bg-indigo-100 text-indigo-600 rounded-t-md"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            ➕ Add Employee
                        </Link>
                        <button
                            onClick={() => {
                                setMobileMenuOpen(false);
                                handleLogout();
                            }}
                            className="px-4 py-2 hover:bg-red-100 text-red-600 rounded-b-md text-left"
                        >
                            🚪 Logout
                        </button>
                    </div>
                )}
            </header>

            {/* 🔹 Content Area */}
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
