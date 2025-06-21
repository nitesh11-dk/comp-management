export const users = [
  // Admin user
  {
    id: "admin001",
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "System Administrator",
    email: "admin@company.com",
  },

  // Supervisors with department assignments
  {
    id: "sup001",
    username: "supervisor1",
    password: "super123",
    role: "supervisor",
    name: "Rajesh Kumar",
    email: "rajesh@company.com",
    departmentId: "packing", // Assigned to Packing department
  },
  {
    id: "sup002",
    username: "supervisor2",
    password: "super456",
    role: "supervisor",
    name: "Priya Sharma",
    email: "priya@company.com",
    departmentId: "production", // Assigned to Production department
  },
  {
    id: "sup003",
    username: "supervisor3",
    password: "super789",
    role: "supervisor",
    name: "Amit Singh",
    email: "amit@company.com",
    departmentId: "maintenance", // Assigned to Maintenance department
  },
  {
    id: "sup004",
    username: "supervisor4",
    password: "super321",
    role: "supervisor",
    name: "Sunita Devi",
    email: "sunita@company.com",
    departmentId: "quality", // Assigned to Quality department
  },

  // Employee users
  {
    id: "emp001",
    username: "emp001",
    password: "emp123",
    role: "employee",
    name: "Ravi Kumar",
    email: "ravi@company.com",
    employeeId: "emp001",
  },
  {
    id: "emp002",
    username: "emp002",
    password: "emp123",
    role: "employee",
    name: "Prashant Singh",
    email: "prashant@company.com",
    employeeId: "emp002",
  },
  {
    id: "emp003",
    username: "emp003",
    password: "emp123",
    role: "employee",
    name: "Anita Sharma",
    email: "anita@company.com",
    employeeId: "emp003",
  },
]
