import { randomBytes } from "node:crypto";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { hashPassword } from "@/lib/server/password";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";

type Context = { params: Promise<{ userId: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { userId } = await context.params;
    const temporaryPassword = `${randomBytes(9).toString("base64url")}A1!`;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true },
    });
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: userId, role: { not: UserRole.ADMIN } },
        data: {
          passwordHash: hashPassword(temporaryPassword),
          isActive: true,
        },
      });
      await transaction.session.deleteMany({ where: { userId } });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "USER_PASSWORD_RESET",
        targetType: "USER",
        targetId: userId,
        targetName: user.name,
        details: { sessionsRevoked: true },
        request,
      });
    });
    return NextResponse.json({ temporaryPassword });
  } catch (error) {
    return handleApiError(error);
  }
}
