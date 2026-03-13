import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTHENTICATED_HOME_PATH } from "@/lib/authRedirects";

const SESSION_COOKIE_KEY = "steve_session";

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_KEY)?.value;

  const isAuthRoute = pathname === "/" || pathname === "/login";
  const protectedPrefixes = [
    "/chat",
    "/profile",
    "/discovery",
    "/inbox",
    "/reports",
    "/add-friends",
    "/search-result",
    "/personal-profile",
  ];
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL(AUTHENTICATED_HOME_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
