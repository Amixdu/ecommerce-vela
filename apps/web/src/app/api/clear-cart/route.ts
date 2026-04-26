import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route handlers can write cookies; server components cannot.
// The checkout page redirects here when it detects a stale cart.
export function GET(request: NextRequest) {
  const redirectTo = new URL("/cart?cleared=1", request.url);
  const response = NextResponse.redirect(redirectTo);
  // Explicit maxAge:0 is more reliable than .delete() for httpOnly cookies
  response.cookies.set("medusa_cart_id", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });
  return response;
}
