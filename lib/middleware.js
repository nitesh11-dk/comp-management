import { getUserFromToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function middleware(req) {
  const cookiesList = await cookies();
  const token = cookiesList.get("token")?.value;
  const pathname = req.nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin");

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // Handle protected routes
  if (isProtectedRoute) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));

    const payload = await getUserFromToken(token);
    if (!payload) return NextResponse.redirect(new URL("/login", req.url));

    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.id);
    return response;
  }

  // Prevent logged-in users from visiting login/register
  if (isAuthPage && token) {
    const payload = await getUserFromToken(token);
    if (payload) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}
