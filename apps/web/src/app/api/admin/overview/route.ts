import {
  MerchantStatus,
  OrderStatus,
  StoreStatus,
  UserRole,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 29);
    start.setUTCHours(0, 0, 0, 0);

    const [
      merchantGroups,
      storeGroups,
      userGroups,
      orderGroups,
      completedRevenue,
      recentOrders,
      recentActivity,
    ] = await Promise.all([
      prisma.merchant.groupBy({ by: ["status"], _count: true }),
      prisma.store.groupBy({
        by: ["status", "isPublished"],
        _count: true,
      }),
      prisma.user.groupBy({ by: ["isActive"], _count: true }),
      prisma.order.groupBy({ by: ["status"], _count: true }),
      prisma.order.groupBy({
        by: ["currency"],
        where: { status: OrderStatus.COMPLETED },
        _sum: { subtotal: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      prisma.adminAuditLog.findMany({
        include: { admin: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    const merchantCount = countBy(merchantGroups);
    const orderCount = countBy(orderGroups);
    const trend = createOrderTrend(recentOrders);

    return NextResponse.json({
      merchants: {
        total: sumCounts(merchantGroups),
        active: merchantCount.get(MerchantStatus.ACTIVE) ?? 0,
        pending: merchantCount.get(MerchantStatus.PENDING) ?? 0,
        suspended: merchantCount.get(MerchantStatus.SUSPENDED) ?? 0,
      },
      stores: {
        total: sumCounts(storeGroups),
        published: storeGroups
          .filter((group) => group.isPublished)
          .reduce((total, group) => total + group._count, 0),
        inactive: storeGroups
          .filter((group) => group.status === StoreStatus.INACTIVE)
          .reduce((total, group) => total + group._count, 0),
      },
      users: {
        total: sumCounts(userGroups),
        active: userGroups.find((group) => group.isActive)?._count ?? 0,
        disabled: userGroups.find((group) => !group.isActive)?._count ?? 0,
      },
      orders: {
        total: sumCounts(orderGroups),
        active: [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ].reduce((total, status) => total + (orderCount.get(status) ?? 0), 0),
        completed: orderCount.get(OrderStatus.COMPLETED) ?? 0,
        cancelled: orderCount.get(OrderStatus.CANCELLED) ?? 0,
        revenueByCurrency: completedRevenue.map((group) => ({
          currency: group.currency,
          value: Number(group._sum.subtotal ?? 0),
        })),
      },
      trend,
      recentActivity: recentActivity.map((entry) => ({
        id: entry.id,
        action: entry.action,
        targetType: entry.targetType,
        targetName: entry.targetName,
        adminName: entry.admin.name,
        createdAt: entry.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function countBy<T extends { status: string; _count: number }>(groups: T[]) {
  return new Map(groups.map((group) => [group.status, group._count]));
}

function sumCounts(groups: Array<{ _count: number }>) {
  return groups.reduce((total, group) => total + group._count, 0);
}

function createOrderTrend(orders: Array<{ createdAt: Date }>) {
  const points = new Map<string, { date: string; orders: number }>();
  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    points.set(key, { date: key, orders: 0 });
  }
  for (const order of orders) {
    const point = points.get(order.createdAt.toISOString().slice(0, 10));
    if (point) point.orders += 1;
  }
  return [...points.values()];
}
