import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import { readBoolean, readObject } from "@/lib/server/validation";

type Context = { params: Promise<{ userId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { userId } = await context.params;
    const body = readObject(await request.json());
    const existing = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, isActive: true, role: true },
    });
    const result = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.user.update({
        where: { id: userId, role: { not: UserRole.ADMIN } },
        data: { isActive: readBoolean(body, "isActive") },
        select: { id: true, isActive: true },
      });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "USER_ACCESS_CHANGED",
        targetType: "USER",
        targetId: userId,
        targetName: existing.name,
        details: {
          before: existing.isActive,
          after: updated.isActive,
          role: existing.role,
        },
        request,
      });
      return updated;
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
