"use server";

import bcrypt from "bcryptjs";
import connect from "@/lib/mongo";
import User from "@/lib/models/User";

export async function registerUser(formData: {
  username: string;
  password: string;
  role: "admin" | "supervisor";
  departmentId?: string;
}) {
  let { username, password, role, departmentId } = formData;

  await connect();

  // ✅ normalize username
  username = username.trim().toLowerCase();

  // ✅ validate username format (only lowercase letters + numbers)
  const usernameRegex = /^[a-z0-9]+$/;
  if (!usernameRegex.test(username)) {
    return {
      success: false,
      message:
        "Username must contain only lowercase letters and numbers (no spaces, no special characters).",
    };
  }

  // check if username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return { success: false, message: "Username already exists" };
  }

  // hash password
  const hashed = await bcrypt.hash(password, 10);

  // create user
  const user = await User.create({
    username,
    password: hashed,
    role,
    departmentId: role === "supervisor" ? departmentId : undefined,
  });

  return { success: true, message: "Registered successfully", user };
}
