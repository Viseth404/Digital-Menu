import { StoreStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import { readBoolean, readObject, readString } from "@/lib/server/validation";

type Context = { params: Promise<{ storeId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { storeId } = await context.params;
    const body = readObject(await request.json());
    const value = readString(body, "status", { optional: true });
    const status = value as StoreStatus | undefined;
    if (status && !Object.values(StoreStatus).includes(status)) {
      throw new ApiException("Invalid store status", 400);
    }
    const existing = await prisma.store.findUniqueOrThrow({
      where: { id: storeId },
      select: { name: true, status: true, isPublished: true },
    });
    const result = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.store.update({
        where: { id: storeId },
        data: {
          status,
          isPublished: readBoolean(body, "isPublished"),
        },
        select: { id: true, status: true, isPublished: true },
      });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "STORE_STATE_CHANGED",
        targetType: "STORE",
        targetId: storeId,
        targetName: existing.name,
        details: {
          before: {
            status: existing.status,
            isPublished: existing.isPublished,
          },
          after: {
            status: updated.status,
            isPublished: updated.isPublished,
          },
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
