import { NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/config/app-config";
import { handleApiError, ApiException } from "@/lib/server/api-response";
import {
  createSessionToken,
  hashSessionToken,
  verifyPassword,
} from "@/lib/server/password";
import { prisma } from "@/lib/server/prisma";
import { getPlatformOperationalSettings } from "@/features/admin-support/server/settings";
import { getRequestIp } from "@/features/admin-support/server/audit";
import { assertEmail, readObject, readString } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  try {
    const body = readObject(await request.json());
    const email = assertEmail(readString(body, "email")!);
    const password = readString(body, "password", { min: 8 })!;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      throw new ApiException(
        "Account temporarily locked. Try again in 15 minutes.",
        423,
      );
    }

    if (
      !user?.isActive ||
      user.deletedAt ||
      !verifyPassword(password, user.passwordHash)
    ) {
      if (user && !user.deletedAt) {
        const attempts = user.failedLoginAttempts + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockedUntil:
              attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
          },
        });
      }
      throw new ApiException("Invalid email or password", 401);
    }

    const token = createSessionToken();
    const settings = await getPlatformOperationalSettings();
    const expiresAt = new Date(
      Date.now() + settings.sessionDurationDays * 24 * 60 * 60 * 1000,
    );
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      }),
      prisma.session.create({
        data: {
          tokenHash: hashSessionToken(token),
          userId: user.id,
          expiresAt,
          ipAddress: getRequestIp(request),
          userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
        },
      }),
    ]);

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    response.cookies.set(appConfig.sessionCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
