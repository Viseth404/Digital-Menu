import { OrderStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const statusValue = request.nextUrl.searchParams.get("status");
    const status = Object.values(OrderStatus).includes(
      statusValue as OrderStatus,
    )
      ? (statusValue as OrderStatus)
      : undefined;
    const fromValue = request.nextUrl.searchParams.get("from");
    const toValue = request.nextUrl.searchParams.get("to");
    const from = fromValue ? new Date(`${fromValue}T00:00:00.000Z`) : undefined;
    const to = toValue ? new Date(`${toValue}T23:59:59.999Z`) : undefined;

    const orders = await prisma.order.findMany({
      where: {
        status,
        createdAt:
          from || to
            ? {
                gte: from,
                lte: to,
              }
            : undefined,
        OR: search
          ? [
              { id: { contains: search, mode: "insensitive" } },
              {
                store: {
                  name: { contains: search, mode: "insensitive" },
                },
              },
              {
                store: {
                  merchant: {
                    name: { contains: search, mode: "insensitive" },
                  },
                },
              },
            ]
          : undefined,
      },
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
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(orders);
  } catch (error) {
    return handleApiError(error);
  }
}
