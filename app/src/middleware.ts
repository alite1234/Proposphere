import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/onboarding", "/clients", "/proposals", "/studio", "/quotations", "/receipts", "/payments", "/projects", "/finance", "/analytics", "/services", "/packages", "/settings", "/team", "/notifications", "/activity", "/portfolio", "/search"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    // Auth check happens server-side in layouts; middleware is a fast first gate.
    const hasCookie = req.cookies.has("pai_session");
    if (!hasCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|p/).*)"],
};
