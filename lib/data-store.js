import { employees } from "../constants/employees.js"
import { departments } from "../constants/departments.js"
import { shifts } from "../constants/shifts.js"
import { users } from "../constants/users.js"

// In-memory data store (will be replaced with MongoDB later)
class DataStore {
  constructor() {
    this.employees = [...employees]
    this.departments = [...departments]
    this.shifts = { ...shifts }
    this.users = [...users]
    this.attendanceLogs = []
    this.currentUser = null
  }

  // Employee operations
  getEmployees() {
    return this.employees
  }

  getEmployeeById(id) {
    return this.employees.find((emp) => emp.id === id)
  }

  getEmployeeByBarcode(barcodeId) {
    return this.employees.find((emp) => emp.barcodeId === barcodeId)
  }

  addEmployee(employee) {
    const newEmployee = {
      ...employee,
      id: `emp${String(this.employees.length + 1).padStart(3, "0")}`,
    }
    this.employees.push(newEmployee)
    return newEmployee
  }

  updateEmployee(id, updates) {
    const index = this.employees.findIndex((emp) => emp.id === id)
    if (index !== -1) {
      this.employees[index] = { ...this.employees[index], ...updates }
      return this.employees[index]
    }
    return null
  }

  deleteEmployee(id) {
    const index = this.employees.findIndex((emp) => emp.id === id)
    if (index !== -1) {
      return this.employees.splice(index, 1)[0]
    }
    return null
  }

  // Attendance operations
  getAttendanceLogs(employeeId = null, date = null) {
    let logs = this.attendanceLogs

    if (employeeId) {
      logs = logs.filter((log) => log.employeeId === employeeId)
    }

    if (date) {
      const targetDate = new Date(date).toDateString()
      logs = logs.filter((log) => new Date(log.date).toDateString() === targetDate)
    }

    return logs.sort((a, b) => new Date(b.inTime) - new Date(a.inTime))
  }

  getLastAttendanceLog(employeeId) {
    const logs = this.attendanceLogs
      .filter((log) => log.employeeId === employeeId)
      .sort((a, b) => new Date(b.inTime) - new Date(a.inTime))

    return logs[0] || null
  }

  createAttendanceLog(logData) {
    const newLog = {
      id: `log${Date.now()}`,
      employeeId: logData.employeeId,
      date: new Date().toISOString().split("T")[0],
      inTime: logData.inTime,
      outTime: null,
      departmentId: logData.departmentId,
      totalHours: 0,
      status: "IN",
    }

    this.attendanceLogs.push(newLog)
    return newLog
  }

  updateAttendanceLog(logId, updates) {
    const index = this.attendanceLogs.findIndex((log) => log.id === logId)
    if (index !== -1) {
      this.attendanceLogs[index] = { ...this.attendanceLogs[index], ...updates }

      // Calculate total hours if outTime is provided
      if (updates.outTime && this.attendanceLogs[index].inTime) {
        const inTime = new Date(this.attendanceLogs[index].inTime)
        const outTime = new Date(updates.outTime)
        const totalHours = (outTime - inTime) / (1000 * 60 * 60)
        this.attendanceLogs[index].totalHours = Math.round(totalHours * 100) / 100
        this.attendanceLogs[index].status = "OUT"
      }

      return this.attendanceLogs[index]
    }
    return null
  }

  // User operations
  authenticateUser(username, password) {
    const user = this.users.find((u) => u.username === username && u.password === password)
    if (user) {
      this.currentUser = user
      return { ...user, password: undefined } // Don't return password
    }
    return null
  }

  getCurrentUser() {
    return this.currentUser ? { ...this.currentUser, password: undefined } : null
  }

  logout() {
    this.currentUser = null
  }

  // Department operations
  getDepartments() {
    return this.departments
  }

  getDepartmentById(id) {
    return this.departments.find((dept) => dept.id === id)
  }

  // Shift operations
  getShifts() {
    return this.shifts
  }

  getShiftById(id) {
    return this.shifts[id]
  }

  // Reports
  getMonthlyAttendanceReport(month, year) {
    const logs = this.attendanceLogs.filter((log) => {
      const logDate = new Date(log.date)
      return logDate.getMonth() === month && logDate.getFullYear() === year
    })

    return logs.map((log) => {
      const employee = this.getEmployeeById(log.employeeId)
      const department = this.getDepartmentById(log.departmentId)

      return {
        ...log,
        employeeName: employee?.name,
        employeeCode: employee?.empCode,
        departmentName: department?.name,
      }
    })
  }

  getSalaryReport(employeeId, month, year) {
    const logs = this.getAttendanceLogs(employeeId).filter((log) => {
      const logDate = new Date(log.date)
      return logDate.getMonth() === month && logDate.getFullYear() === year && log.outTime
    })

    const employee = this.getEmployeeById(employeeId)
    const totalHours = logs.reduce((sum, log) => sum + log.totalHours, 0)
    const totalSalary = totalHours * (employee?.hourlyRate || 0)

    return {
      employee,
      totalHours,
      totalSalary,
      workingDays: logs.length,
      logs,
    }
  }
}

export const dataStore = new DataStore()
