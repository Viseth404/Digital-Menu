import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireManagedStore } from "@/features/stores/merchant-access";

type Context = { params: Promise<{ storeId: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const { storeId } = await context.params;
    await requireManagedStore(request, storeId);
    return NextResponse.json(
      await prisma.order.findMany({
        where: { storeId },
        include: {
          table: { select: { id: true, number: true, name: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
