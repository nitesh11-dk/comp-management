"use server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import connect from "@/lib/mongo";
import User from "@/lib/models/User";

export async function loginUser(formData: FormData) {
  const username = formData.get("username"); // 🔄 since your register uses `username`, not email
  const password = formData.get("password") as string;

  await connect();
  const user = await User.findOne({ username });
  if (!user) return { success: false, message: "User not found" };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { success: false, message: "Invalid credentials" };

  // ✅ include role inside token payload
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role, // include admin/supervisor
      departmentId: user.role === "supervisor" ? user.departmentId : null,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

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
      id: user._id,
      username: user.username,
      role: user.role,
      departmentId: user.departmentId,
    },
  };
}
