import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireStoreAccess } from "@/features/stores/merchant-access";

type Context = { params: Promise<{ storeId: string }> };

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY"] as const;

export async function GET(request: NextRequest, context: Context) {
  try {
    const { storeId } = await context.params;
    const store = await requireStoreAccess(request, storeId);
    const range = request.nextUrl.searchParams.get("range") === "30" ? 30 : 7;
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - (range - 1));
    start.setUTCHours(0, 0, 0, 0);

    const [orders, productCount, categoryCount, tableCount] = await Promise.all(
      [
        prisma.order.findMany({
          where: { storeId, createdAt: { gte: start } },
          include: {
            table: { select: { number: true } },
            items: {
              select: {
                productName: true,
                quantity: true,
                lineTotal: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where: { storeId } }),
        prisma.category.count({ where: { storeId, isActive: true } }),
        prisma.diningTable.count({ where: { storeId, isActive: true } }),
      ],
    );

    const completed = orders.filter((order) => order.status === "COMPLETED");
    const revenue = sum(completed.map((order) => Number(order.subtotal)));
    const todayKey = toDateKey(new Date(), store.timezone);
    const trend = createTrend(range, store.timezone, completed);
    const statusCounts = new Map<string, number>();
    const itemTotals = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    for (const order of orders) {
      statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
    }
    for (const order of completed) {
      for (const item of order.items) {
        const current = itemTotals.get(item.productName) ?? {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += item.quantity;
        current.revenue += Number(item.lineTotal);
        itemTotals.set(item.productName, current);
      }
    }

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        currency: store.currency,
        isPublished: store.isPublished,
        productCount,
        categoryCount,
        tableCount,
      },
      summary: {
        revenue,
        todayRevenue:
          trend.find((point) => point.date === todayKey)?.revenue ?? 0,
        completedOrders: completed.length,
        totalOrders: orders.filter((order) => order.status !== "CANCELLED")
          .length,
        activeOrders: orders.filter((order) =>
          ACTIVE_STATUSES.includes(
            order.status as (typeof ACTIVE_STATUSES)[number],
          ),
        ).length,
        averageOrder: completed.length ? revenue / completed.length : 0,
      },
      trend,
      statuses: [...statusCounts].map(([status, count]) => ({
        status,
        count,
      })),
      topItems: [...itemTotals.values()]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5),
      recentOrders: orders.slice(0, 8).map((order) => ({
        id: order.id,
        tableNumber: order.table.number,
        status: order.status,
        total: Number(order.subtotal),
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function createTrend(
  range: number,
  timezone: string,
  orders: Array<{ createdAt: Date; subtotal: unknown }>,
) {
  const points = new Map<
    string,
    { date: string; revenue: number; orders: number }
  >();
  for (let offset = range - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    const key = toDateKey(date, timezone);
    points.set(key, { date: key, revenue: 0, orders: 0 });
  }
  for (const order of orders) {
    const point = points.get(toDateKey(order.createdAt, timezone));
    if (point) {
      point.revenue += Number(order.subtotal);
      point.orders += 1;
    }
  }
  return [...points.values()];
}

function toDateKey(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
