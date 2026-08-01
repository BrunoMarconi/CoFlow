import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/comunidades",
  "/usuarios",
  "/pisos",
  "/perfil",
  "/crear",
  "/ajustes",
];

const AUTH_ONLY_ROUTES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthOnlyRoute && token) {
    return NextResponse.redirect(new URL("/comunidades", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/comunidades/:path*",
    "/usuarios/:path*",
    "/pisos/:path*",
    "/perfil/:path*",
    "/crear/:path*",
    "/ajustes/:path*",
    "/login",
    "/register",
  ],
};
