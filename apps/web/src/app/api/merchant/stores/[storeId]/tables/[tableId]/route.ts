import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireManagedStore } from "@/features/stores/merchant-access";

type Context = {
  params: Promise<{ storeId: string; tableId: string }>;
};

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { storeId, tableId } = await context.params;
    await requireManagedStore(request, storeId);
    const table = await prisma.diningTable.findFirst({
      where: { id: tableId, storeId },
      include: { _count: { select: { orders: true } } },
    });
    if (!table) throw new ApiException("Table not found", 404);
    if (table._count.orders) {
      throw new ApiException(
        "Tables with order history cannot be deleted",
        409,
      );
    }
    await prisma.diningTable.delete({ where: { id: tableId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
