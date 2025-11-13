"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function registerUser(formData: {
  username: string;
  password: string;
  role: "admin" | "supervisor";
  departmentId?: string;
}) {
  let { username, password, role, departmentId } = formData;

  // Normalize username
  username = username.trim().toLowerCase();

  // Validate username format
  const usernameRegex = /^[a-z0-9]+$/;
  if (!usernameRegex.test(username)) {
    return {
      success: false,
      message:
        "Username must contain only lowercase letters and numbers (no spaces, no special characters).",
    };
  }

  // Check if username exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return { success: false, message: "Username already exists" };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Supervisor must have departmentId
  if (role === "supervisor" && !departmentId) {
    return { success: false, message: "Supervisor must have a department" };
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role,
      departmentId: role === "supervisor" ? departmentId : null,
    },
  });

  return {
    success: true,
    message: "Registered successfully",
    user,
  };
}
