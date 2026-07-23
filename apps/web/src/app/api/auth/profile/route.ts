import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { verifyPassword } from "@/lib/server/password";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import {
  assertEmail,
  readObject,
  readString,
} from "@/lib/server/validation";

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await requireRequestUser(request);
    const body = readObject(await request.json());
    const name = readString(body, "name", { min: 2 })!;
    const email = assertEmail(readString(body, "email")!);
    const currentPassword = readString(body, "currentPassword", {
      min: 8,
      optional: true,
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: sessionUser.id },
      select: { email: true, passwordHash: true },
    });

    if (email !== user.email) {
      if (
        !currentPassword ||
        !verifyPassword(currentPassword, user.passwordHash)
      ) {
        throw new ApiException(
          "Current password is required to change your login email",
          400,
        );
      }
      if (await prisma.user.findUnique({ where: { email } })) {
        throw new ApiException("Email is already in use", 409);
      }
    }

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
