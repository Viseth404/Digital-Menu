import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import { requireUserSubscriptionAccess } from "@/features/subscriptions/server/lifecycle";
import { getMerchantQuota } from "@/features/subscriptions/server/quotas";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRequestUser(request, [
      UserRole.MERCHANT,
      UserRole.STAFF,
    ]);
    const merchantIds = await requireUserSubscriptionAccess(user.id);
    const stores = await prisma.store.findMany({
      where: {
        merchantId: { in: merchantIds },
        merchant: {
          deletedAt: null,
          members: { some: { userId: user.id } },
        },
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    const quotas = new Map(
      await Promise.all(
        merchantIds.map(
          async (merchantId) =>
            [merchantId, await getMerchantQuota(merchantId)] as const,
        ),
      ),
    );
    return NextResponse.json(
      stores.map((store) => ({
        ...store,
        quota: quotas.get(store.merchantId),
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
