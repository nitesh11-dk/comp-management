"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function registerUser(formData: {
  username: string;
  password: string;
  departmentId: string;
}) {
  let { username, password, departmentId } = formData;

  // 🔽 Normalize username (FORCE lowercase)
  username = username.trim().toLowerCase();

  // ✅ Validate username format (lowercase + numbers only)
  const usernameRegex = /^[a-z0-9]+$/;
  if (!usernameRegex.test(username)) {
    return {
      success: false,
      message:
        "Username must contain only lowercase letters and numbers (no spaces, no special characters).",
    };
  }

  // 🔍 Check if username already exists (lowercase match)
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return { success: false, message: "Username already exists" };
  }

  // 🔐 Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 👤 Create ONLY supervisor (hard-coded)
  const user = await prisma.user.create({
    data: {
      username, // ✅ always lowercase
      password: hashedPassword,
      role: "supervisor",
      departmentId,
    },
  });

  return {
    success: true,
    message: "Supervisor registered successfully",
    user: {
      id: user.id,
      username: user.username, // lowercase from DB
      role: user.role,
      departmentId: user.departmentId,
    },
  };
}
