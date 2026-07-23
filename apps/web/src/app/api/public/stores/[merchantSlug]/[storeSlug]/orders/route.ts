import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import {
  readNullableString,
  readObject,
  readString,
} from "@/lib/server/validation";
import { findPublicStore } from "@/features/stores/server";

type Context = {
  params: Promise<{ merchantSlug: string; storeSlug: string }>;
};

export async function POST(request: NextRequest, context: Context) {
  try {
    const { merchantSlug, storeSlug } = await context.params;
    const store = await findPublicStore(merchantSlug, storeSlug);
    if (!store) throw new ApiException("Storefront not found", 404);

    const body = readObject(await request.json());
    const tableId = readString(body, "tableId")!;
    const tableToken = readString(body, "tableToken")!;
    const table = await prisma.diningTable.findFirst({
      where: {
        id: tableId,
        storeId: store.id,
        orderToken: tableToken,
        isActive: true,
      },
      select: { id: true },
    });
    if (!table) throw new ApiException("Select a valid table", 400);

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new ApiException("Your order is empty", 400);
    }
    if (body.items.length > 50) {
      throw new ApiException("Order has too many items", 400);
    }

    const quantities = new Map<string, number>();
    for (const value of body.items) {
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
      quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    }

    const products = store.products.filter((product) =>
      quantities.has(product.id),
    );
    if (products.length !== quantities.size) {
      throw new ApiException("One or more products are unavailable", 400);
    }

    const multiplier =
      store.currency === "USD" ? 1 : Number(store.exchangeRate);
    const items = products.map((product) => {
      const quantity = quantities.get(product.id)!;
      const unitPrice = Number(product.price) * multiplier;
      return {
        productId: product.id,
        productName: product.name,
        unitPrice: new Prisma.Decimal(unitPrice.toFixed(2)),
        quantity,
        lineTotal: new Prisma.Decimal((unitPrice * quantity).toFixed(2)),
      };
    });
    const subtotal = items.reduce(
      (total, item) => total + Number(item.lineTotal),
      0,
    );

    const order = await prisma.order.create({
      data: {
        storeId: store.id,
        tableId,
        currency: store.currency,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        note: readNullableString(body, "note"),
        items: { create: items },
      },
      include: {
        table: { select: { id: true, number: true, name: true } },
        items: true,
      },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
