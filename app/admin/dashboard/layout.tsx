"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
            toast.success("Logged out successfully");
            router.push("/login");
        } catch (err) {
            console.error("Logout error:", err);
            toast.error("Failed to logout");
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
        <div className="flex min-h-screen flex-col bg-gray-50">
            {/* 🔹 Top Navbar */}
            <header className="w-full bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center relative">
                <div className="text-xl font-bold text-gray-900">Admin Panel</div>

                {/* Desktop Menu */}
                <div className="hidden sm:flex gap-3">
                    <Link
                        href="/admin/dashboard/addemp"
                        className="py-2 px-4 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors duration-200 font-medium"
                    >
                        Add Employee
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="py-2 px-4 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 transition-colors duration-200 font-medium border border-gray-300"
                    >
                        Logout
                    </button>
                </div>

                {/* Mobile Hamburger */}
                <button
                    className="sm:hidden p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors duration-200 border border-gray-300"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
                </button>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div
                        ref={menuRef}
                        className="absolute right-6 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg flex flex-col z-20 sm:hidden"
                    >
                        <Link
                            href="/admin/dashboard/addemp"
                            className="px-4 py-3 hover:bg-gray-50 text-gray-900 border-b border-gray-100 font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Add Employee
                        </Link>
                        <button
                            onClick={() => {
                                setMobileMenuOpen(false);
                                handleLogout();
                            }}
                            className="px-4 py-3 hover:bg-gray-50 text-gray-900 text-left font-medium"
                        >
                            Logout
                        </button>
                    </div>
                )}
            </header>

            {/* 🔹 Content Area */}
            <main className="flex-1 p-4">{children}</main>
        </div>
    );
}
