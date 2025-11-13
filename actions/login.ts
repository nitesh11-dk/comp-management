"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function loginUser(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // 🔍 find user by username
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return { success: false, message: "User not found" };
  }

  // 🔐 compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { success: false, message: "Invalid credentials" };
  }

  // 🎫 JWT payload
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      departmentId: user.role === "supervisor" ? user.departmentId : null,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  // 🍪 set cookie
  cookies().set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return {
    success: true,
    message: "Login successful",
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId,
    },
  };
}
