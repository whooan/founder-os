import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  const sitePassword = process.env.SITE_PASSWORD;

  // No password set — skip auth (local dev only)
  if (!sitePassword) {
    return NextResponse.next();
  }

  // Check for auth session cookie
  const session = request.cookies.get("founderos_auth");

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify session
  try {
    const decoded = Buffer.from(session.value, "base64").toString();
    const [timestamp, hash] = decoded.split(":");

    // Expired (7 days)
    if (Date.now() - parseInt(timestamp) > 7 * 24 * 60 * 60 * 1000) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("founderos_auth");
      return response;
    }

    // Verify hash
    const expectedHash = Buffer.from(sitePassword + timestamp)
      .toString("base64")
      .slice(0, 32);

    if (hash !== expectedHash) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("founderos_auth");
      return response;
    }
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("founderos_auth");
    return response;
  }

  // Authenticated — if trying to visit /login, redirect to home
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
