import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth";

export async function middleware(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const pathname = req.url ? new URL(req.url).pathname : "";

  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // If route is protected
  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const payload = await getUserFromToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // ✅ Role-based route restriction
    if (pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/dashboard") && payload.role !== "supervisor") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.id);
    response.headers.set("x-user-role", payload.role);
    return response;
  }

  // Prevent logged-in users from accessing login/register
  if (isAuthPage && token) {
    const payload = await getUserFromToken(token);
    if (payload) {
      const redirectUrl =
        payload.role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
  }

  return NextResponse.next();
}

// ✅ Limit middleware to specific paths
export const config = {
  matcher: ["/login", "/register", "/dashboard/:path*", "/admin/:path*"],
};
