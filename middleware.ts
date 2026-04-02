import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    console.log("Acceso al dashboard:", new Date().toISOString());
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
