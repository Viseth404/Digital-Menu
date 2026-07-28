import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/config/app-config";

export function middleware(request: NextRequest) {
  const hasSession = Boolean(
    request.cookies.get(appConfig.sessionCookieName)?.value,
  );

  if (!hasSession) {
    return NextResponse.redirect(new URL(appConfig.routes.login, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/merchant/:path*"],
};
