"use client"

import { useAuth } from "../contexts/auth-context"
import LoginForm from "../components/login-form"
import EmployeeManagement from "../components/admin/employee-management"
import BarcodeScanner from "../components/supervisor/barcode-scanner"
import EmployeeDashboard from "../components/employee/employee-dashboard"
import { Button } from "@/components/ui/button"
import { LogOut, Users, Scan, User, Plus } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { user, logout, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const getRoleIcon = () => {
    switch (user.role) {
      case "admin":
        return <Users className="h-5 w-5" />
      case "supervisor":
        return <Scan className="h-5 w-5" />
      case "employee":
        return <User className="h-5 w-5" />
      default:
        return <User className="h-5 w-5" />
    }
  }

  const getRoleComponent = () => {
    switch (user.role) {
      case "admin":
        return <EmployeeManagement />
      case "supervisor":
        return <BarcodeScanner />
      case "employee":
        return <EmployeeDashboard />
      default:
        return <div>Unknown role</div>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {getRoleIcon()}
            <div>
              <h1 className="text-xl font-bold">Manpower Management System</h1>
              <p className="text-sm text-muted-foreground">
                {user.name} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(user.role === "admin" || user.role === "supervisor") && (
              <Link href="/add-employee">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{getRoleComponent()}</main>
    </div>
  )
}
