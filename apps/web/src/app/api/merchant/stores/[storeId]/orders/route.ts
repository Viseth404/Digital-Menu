import {
  OrderSource,
  OrderStatus,
  PaymentMethod,
  Prisma,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireManagedStore } from "@/features/stores/merchant-access";
import {
  readNullableString,
  readObject,
  readString,
} from "@/lib/server/validation";

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
          items: { include: { options: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { storeId } = await context.params;
    const store = await requireManagedStore(request, storeId);
    const body = readObject(await request.json());
    const paymentMethod = readString(body, "paymentMethod") as PaymentMethod;
    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new ApiException("Choose a valid payment method", 400);
    }
    if (
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      body.items.length > 50
    ) {
      throw new ApiException("Add between 1 and 50 products", 400);
    }

    const requestedItems = body.items.map((value) => {
      const item = readObject(value);
      const productId = readString(item, "productId")!;
      const quantity = item.quantity;
      if (
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      ) {
        throw new ApiException("Item quantity must be between 1 and 99", 400);
      }
      return { productId, quantity };
    });
    if (
      new Set(requestedItems.map((item) => item.productId)).size !==
      requestedItems.length
    ) {
      throw new ApiException("Each product may only appear once", 400);
    }

    const products = await prisma.product.findMany({
      where: {
        storeId,
        id: { in: requestedItems.map((item) => item.productId) },
      },
      select: { id: true, name: true, price: true },
    });
    if (products.length !== requestedItems.length) {
      throw new ApiException("One or more products are unavailable", 400);
    }
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const multiplier =
      store.currency === "USD" ? 1 : Number(store.exchangeRate);
    const items = requestedItems.map((requested) => {
      const product = productsById.get(requested.productId)!;
      const unitPrice = Number(product.price) * multiplier;
      return {
        productId: product.id,
        productName: product.name,
        unitPrice: new Prisma.Decimal(unitPrice.toFixed(2)),
        quantity: requested.quantity,
        lineTotal: new Prisma.Decimal(
          (unitPrice * requested.quantity).toFixed(2),
        ),
      };
    });
    const subtotal = items.reduce(
      (total, item) => total + Number(item.lineTotal),
      0,
    );

    const order = await prisma.order.create({
      data: {
        storeId,
        source: OrderSource.MANUAL,
        status: OrderStatus.COMPLETED,
        currency: store.currency,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        paymentMethod,
        note: readNullableString(body, "note"),
        items: { create: items },
      },
      include: {
        table: { select: { id: true, number: true, name: true } },
        items: { include: { options: true } },
      },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
