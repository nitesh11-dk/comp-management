import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function requireAdmin() {
  const token = cookies().get("token")?.value;
  if (!token) throw new Error("Unauthorized");

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing");
  }

  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(process.env.JWT_SECRET)
  );

  if (payload.role !== "admin") {
    throw new Error("Forbidden");
  }

  return payload; // admin payload
}
