// middleware.ts
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};

export default async function middleware(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
