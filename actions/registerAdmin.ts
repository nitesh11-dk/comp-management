"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function adminRegisterUser(formData: FormData) {
  // 🔒 BOOTSTRAP GUARD
  if (process.env.ALLOW_BOOTSTRAP_ADMIN !== "true") {
    throw new Error("Bootstrap admin creation is disabled");
  }

  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") || "");
  const role = formData.get("role") as "admin" | "supervisor";
  const departmentId = String(formData.get("departmentId") || "");

  if (!username || !password || !role) {
    return { success: false, message: "Missing required fields" };
  }

  if (role === "supervisor" && !departmentId) {
    return { success: false, message: "Supervisor needs department" };
  }

  const exists = await prisma.user.findUnique({
    where: { username },
  });

  if (exists) {
    return { success: false, message: "User already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role,
      departmentId: role === "supervisor" ? departmentId : null,
    },
  });

  return {
    success: true,
    message: "User created successfully",
  };
}
