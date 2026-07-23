import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/config/app-config";

export function middleware(request: NextRequest) {
  const hasSession = Boolean(
    request.cookies.get(appConfig.sessionCookieName)?.value,
  );
  const isLoginPage = request.nextUrl.pathname === appConfig.routes.login;

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL(appConfig.routes.login, request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(
      new URL(appConfig.routes.dashboard, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/merchant/:path*"],
};
