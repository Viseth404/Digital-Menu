import "server-only";

import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";

const DEFAULT_PAGE_SIZE = 10;

export async function getReportSnapshot(
  storeId: string,
  currency: string,
  start: Date,
  end: Date,
  options: {
    page?: number;
    pageSize?: number;
    includeOrders?: boolean;
  } = {},
) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const includeOrders = options.includeOrders ?? true;
  const where: Prisma.OrderWhereInput = {
    storeId,
    createdAt: { gte: start, lt: end },
  };
  const [statusRows, totalRow, orders] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { ...where, status: OrderStatus.COMPLETED },
      _sum: { subtotal: true },
    }),
    includeOrders
      ? prisma.order.findMany({
          where,
          include: {
            table: { select: { id: true, number: true, name: true } },
            items: { include: { options: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        })
      : Promise.resolve([]),
  ]);

  const statusCounts = Object.fromEntries(
    statusRows.map((row) => [row.status, row._count._all]),
  );
  const orderCount = statusRows.reduce(
    (total, row) => total + row._count._all,
    0,
  );
  const completedCount = statusCounts[OrderStatus.COMPLETED] ?? 0;
  const cancelledCount = statusCounts[OrderStatus.CANCELLED] ?? 0;
  const total = totalRow._sum.subtotal ?? new Prisma.Decimal(0);
  const averageOrder = completedCount
    ? total.dividedBy(completedCount)
    : new Prisma.Decimal(0);

  return {
    summary: {
      orderCount,
      completedCount,
      cancelledCount,
      total: total.toFixed(2),
      averageOrder: averageOrder.toFixed(2),
      currency,
    },
    statusCounts,
    orders,
    pagination: {
      page,
      pageSize,
      totalItems: orderCount,
      totalPages: Math.max(1, Math.ceil(orderCount / pageSize)),
    },
  };
}
