import { OrderSource, OrderStatus, Prisma, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const merchantId = request.nextUrl.searchParams.get("merchantId")?.trim();
    const storeId = request.nextUrl.searchParams.get("storeId")?.trim();
    const statusValue = request.nextUrl.searchParams.get("status");
    const status = Object.values(OrderStatus).includes(
      statusValue as OrderStatus,
    )
      ? (statusValue as OrderStatus)
      : undefined;
    const sourceValue = request.nextUrl.searchParams.get("source");
    const source = Object.values(OrderSource).includes(
      sourceValue as OrderSource,
    )
      ? (sourceValue as OrderSource)
      : undefined;
    const fromValue = request.nextUrl.searchParams.get("from");
    const toValue = request.nextUrl.searchParams.get("to");
    const from = fromValue ? new Date(`${fromValue}T00:00:00.000Z`) : undefined;
    const to = toValue ? new Date(`${toValue}T23:59:59.999Z`) : undefined;
    const page = readPositiveInteger(
      request.nextUrl.searchParams.get("page"),
      1,
    );
    const requestedPageSize = readPositiveInteger(
      request.nextUrl.searchParams.get("pageSize"),
      25,
    );
    const pageSize = [25, 50, 100].includes(requestedPageSize)
      ? requestedPageSize
      : 25;
    const sort = request.nextUrl.searchParams.get("sort");
    const where: Prisma.OrderWhereInput = {
      storeId: storeId || undefined,
      store: merchantId ? { merchantId } : undefined,
      source,
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
            {
              items: {
                some: {
                  productName: { contains: search, mode: "insensitive" },
                },
              },
            },
          ]
        : undefined,
    };

    const [orders, total, merchants] = await prisma.$transaction([
      prisma.order.findMany({
        where,
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
        orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
      prisma.merchant.findMany({
        where: { stores: { some: { orders: { some: {} } } } },
        select: {
          id: true,
          name: true,
          stores: {
            where: { orders: { some: {} } },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);
    return NextResponse.json({
      orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      filterOptions: { merchants },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function readPositiveInteger(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
