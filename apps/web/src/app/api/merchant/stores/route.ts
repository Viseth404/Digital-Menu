import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import { requireUserSubscriptionAccess } from "@/features/subscriptions/server/lifecycle";

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
    return NextResponse.json(stores);
  } catch (error) {
    return handleApiError(error);
  }
}
