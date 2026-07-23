import { MerchantStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import { readObject, readString } from "@/lib/server/validation";

type Context = { params: Promise<{ merchantId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { merchantId } = await context.params;
    const body = readObject(await request.json());
    const status = readString(body, "status") as MerchantStatus;
    if (!Object.values(MerchantStatus).includes(status)) {
      throw new ApiException("Invalid merchant status", 400);
    }
    const existing = await prisma.merchant.findUniqueOrThrow({
      where: { id: merchantId },
      select: { name: true, status: true },
    });
    const result = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.merchant.update({
        where: { id: merchantId },
        data: { status },
        select: { id: true, status: true },
      });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "MERCHANT_STATUS_CHANGED",
        targetType: "MERCHANT",
        targetId: merchantId,
        targetName: existing.name,
        details: { before: existing.status, after: status },
        request,
      });
      return updated;
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
