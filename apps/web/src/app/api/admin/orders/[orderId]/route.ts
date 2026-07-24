import { OrderStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import { readObject, readString } from "@/lib/server/validation";

type Context = { params: Promise<{ orderId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { orderId } = await context.params;
    const body = readObject(await request.json());
    const status = readString(body, "status") as OrderStatus;
    if (!Object.values(OrderStatus).includes(status)) {
      throw new ApiException("Invalid order status", 400);
    }
    const existing = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { store: { select: { name: true } } },
    });
    const order = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              merchant: { select: { id: true, name: true } },
            },
          },
          table: { select: { number: true } },
          items: true,
        },
      });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "ORDER_STATUS_CHANGED",
        targetType: "ORDER",
        targetId: orderId,
        targetName: `#${orderId.slice(-8).toUpperCase()}`,
        details: {
          store: existing.store.name,
          before: existing.status,
          after: status,
        },
        request,
      });
      return updated;
    });
    return NextResponse.json(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { orderId } = await context.params;
    const existing = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            merchant: { select: { id: true, name: true } },
          },
        },
        table: { select: { number: true } },
        items: { select: { id: true } },
      },
    });

    await prisma.$transaction(async (transaction) => {
      await transaction.order.delete({ where: { id: orderId } });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "ORDER_DELETED",
        targetType: "ORDER",
        targetId: orderId,
        targetName: `#${orderId.slice(-8).toUpperCase()}`,
        details: {
          merchantId: existing.store.merchant.id,
          merchant: existing.store.merchant.name,
          storeId: existing.store.id,
          store: existing.store.name,
          table: existing.table.number,
          status: existing.status,
          subtotal: existing.subtotal.toString(),
          currency: existing.currency,
          itemCount: existing.items.length,
        },
        request,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
