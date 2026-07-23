import { randomUUID } from "node:crypto";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";

type Context = { params: Promise<{ storeId: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { storeId } = await context.params;
    const store = await prisma.store.findUniqueOrThrow({
      where: { id: storeId },
      select: { name: true },
    });
    const updated = await prisma.$transaction(async (transaction) => {
      const tables = await transaction.diningTable.findMany({
        where: { storeId },
        select: { id: true },
      });
      for (const table of tables) {
        await transaction.diningTable.update({
          where: { id: table.id },
          data: { orderToken: randomUUID() },
        });
      }
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "STORE_QR_TOKENS_ROTATED",
        targetType: "STORE",
        targetId: storeId,
        targetName: store.name,
        details: { tablesUpdated: tables.length },
        request,
      });
      return tables.length;
    });
    return NextResponse.json({ updated });
  } catch (error) {
    return handleApiError(error);
  }
}
