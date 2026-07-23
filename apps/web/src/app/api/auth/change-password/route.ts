import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import {
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "@/lib/server/password";
import { prisma } from "@/lib/server/prisma";
import {
  getRequestSessionToken,
  requireRequestUser,
} from "@/lib/server/session";
import { readObject, readString } from "@/lib/server/validation";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireRequestUser(request);
    const body = readObject(await request.json());
    const currentPassword = readString(body, "currentPassword", { min: 8 })!;
    const newPassword = readString(body, "newPassword", { min: 8 })!;

    if (currentPassword === newPassword) {
      throw new ApiException(
        "New password must be different from the current password",
        400,
      );
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      select: { passwordHash: true },
    });
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new ApiException("Current password is incorrect", 400);
    }

    const currentToken = getRequestSessionToken(request);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: sessionUser.id },
        data: { passwordHash: hashPassword(newPassword) },
      }),
      prisma.session.deleteMany({
        where: {
          userId: sessionUser.id,
          ...(currentToken
            ? { tokenHash: { not: hashSessionToken(currentToken) } }
            : {}),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
