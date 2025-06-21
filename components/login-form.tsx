"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "../contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Users, UserCheck } from "lucide-react"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await login(username, password)
    if (!success) {
      setError("Invalid username or password")
    }
    setIsLoading(false)
  }

  const demoCredentials = [
    { role: "Admin", username: "admin", password: "admin123", icon: Users, dept: "All Access" },
    {
      role: "Supervisor (Packing)",
      username: "supervisor1",
      password: "super123",
      icon: UserCheck,
      dept: "Packing Dept",
    },
    {
      role: "Supervisor (Production)",
      username: "supervisor2",
      password: "super456",
      icon: UserCheck,
      dept: "Production Dept",
    },
    {
      role: "Supervisor (Maintenance)",
      username: "supervisor3",
      password: "super789",
      icon: UserCheck,
      dept: "Maintenance Dept",
    },
    {
      role: "Supervisor (Quality)",
      username: "supervisor4",
      password: "super321",
      icon: UserCheck,
      dept: "Quality Dept",
    },
    { role: "Employee", username: "emp001", password: "emp123", icon: Building2, dept: "Employee Access" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-2 sm:p-4">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Manpower Management</CardTitle>
            <CardDescription>Sign in to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demo Credentials</CardTitle>
            <CardDescription>Use these credentials to test different roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {demoCredentials.map((cred) => {
              const Icon = cred.icon
              return (
                <div
                  key={cred.role}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg space-y-2 sm:space-y-0 hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setUsername(cred.username)
                    setPassword(cred.password)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <span className="font-medium text-sm sm:text-base">{cred.role}</span>
                      <p className="text-xs text-muted-foreground">{cred.dept}</p>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-mono">
                    {cred.username} / {cred.password}
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-center text-muted-foreground mt-2">
              Click on any credential to auto-fill the form
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
