export const users = [
  {
    id: "admin001",
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "System Administrator",
  },
  {
    id: "sup001",
    username: "packing_sup",
    password: "pack123",
    role: "supervisor",
    name: "Packing Supervisor",
    departmentId: "packing", // Only can handle packing employees
  },
  {
    id: "sup002",
    username: "production_sup",
    password: "prod123",
    role: "supervisor",
    name: "Production Supervisor",
    departmentId: "production", // Only can handle production employees
  },
  {
    id: "sup003",
    username: "quality_sup",
    password: "qual123",
    role: "supervisor",
    name: "Quality Supervisor",
    departmentId: "quality", // Only can handle quality employees
  },
  {
    id: "sup004",
    username: "maintenance_sup",
    password: "maint123",
    role: "supervisor",
    name: "Maintenance Supervisor",
    departmentId: "maintenance", // Only can handle maintenance employees
  },
]
