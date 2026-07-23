import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/config/app-config";
import { handleApiError } from "@/lib/server/api-response";
import { hashSessionToken } from "@/lib/server/password";
import { prisma } from "@/lib/server/prisma";
import { getRequestSessionToken } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  try {
    const token = getRequestSessionToken(request);
    if (token) {
      await prisma.session.deleteMany({
        where: { tokenHash: hashSessionToken(token) },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(appConfig.sessionCookieName);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
