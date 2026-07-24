import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireManagedStore } from "@/features/stores/merchant-access";
import { readObject, readString } from "@/lib/server/validation";

type Context = {
  params: Promise<{ storeId: string; orderId: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { storeId, orderId } = await context.params;
    await requireManagedStore(request, storeId);
    const body = readObject(await request.json());
    const status = readString(body, "status") as OrderStatus;
    if (!Object.values(OrderStatus).includes(status)) {
      throw new ApiException("Invalid order status", 400);
    }
    const existing = await prisma.order.findFirst({
      where: { id: orderId, storeId },
    });
    if (!existing) throw new ApiException("Order not found", 404);
    return NextResponse.json(
      await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          table: { select: { id: true, number: true, name: true } },
          items: { include: { options: true } },
        },
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
