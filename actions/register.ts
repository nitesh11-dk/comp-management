"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function registerUser(formData: {
  username: string;
  password: string;
  departmentId: string;
}) {
  let { username, password, departmentId } = formData;

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

  // Create ONLY supervisor
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role: "supervisor", // 🔒 hard-coded
      departmentId,
    },
  });

  return {
    success: true,
    message: "Supervisor registered successfully",
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId,
    },
  };
}
