import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const sitePassword = process.env.SITE_PASSWORD;

    // If no password configured, deny access in production
    if (!sitePassword) {
      return NextResponse.json(
        { error: "Authentication not configured" },
        { status: 500 }
      );
    }

    // Check password
    if (password !== sitePassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Create session cookie
    const timestamp = Date.now().toString();
    const hash = Buffer.from(sitePassword + timestamp)
      .toString("base64")
      .slice(0, 32);
    const sessionValue = Buffer.from(`${timestamp}:${hash}`).toString("base64");

    const response = NextResponse.json({ success: true });

    // Set cookie for 7 days
    response.cookies.set("founderos_auth", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
