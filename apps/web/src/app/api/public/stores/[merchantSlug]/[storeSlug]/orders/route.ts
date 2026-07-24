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

    const requestedItems: Array<{
      productId: string;
      quantity: number;
      selectedOptionIds: string[];
    }> = [];
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
      const selectedOptionIds = item.selectedOptionIds ?? [];
      if (
        !Array.isArray(selectedOptionIds) ||
        selectedOptionIds.length > 50 ||
        selectedOptionIds.some((id) => typeof id !== "string")
      ) {
        throw new ApiException("Selected product choices are invalid", 400);
      }
      requestedItems.push({ productId, quantity, selectedOptionIds });
    }

    const productsById = new Map(
      store.products.map((product) => [product.id, product]),
    );

    const multiplier =
      store.currency === "USD" ? 1 : Number(store.exchangeRate);
    const items = requestedItems.map((requested) => {
      const product = productsById.get(requested.productId);
      if (!product) {
        throw new ApiException("One or more products are unavailable", 400);
      }
      const selectedIds = new Set(requested.selectedOptionIds);
      if (selectedIds.size !== requested.selectedOptionIds.length) {
        throw new ApiException("A product choice was selected twice", 400);
      }
      const allOptions = product.optionGroups.flatMap((group) =>
        group.options.map((option) => ({ group, option })),
      );
      const selectedOptions = allOptions.filter(({ option }) =>
        selectedIds.has(option.id),
      );
      if (selectedOptions.length !== selectedIds.size) {
        throw new ApiException(
          `One or more choices for ${product.name} are unavailable`,
          400,
        );
      }
      for (const group of product.optionGroups) {
        const count = selectedOptions.filter(
          (selection) => selection.group.id === group.id,
        ).length;
        if (count < group.minSelections || count > group.maxSelections) {
          throw new ApiException(
            `Choose between ${group.minSelections} and ${group.maxSelections} options for ${group.name}`,
            400,
          );
        }
      }

      const optionTotal = selectedOptions.reduce(
        (sum, selection) => sum + Number(selection.option.priceDelta),
        0,
      );
      const unitPrice = (Number(product.price) + optionTotal) * multiplier;
      return {
        productId: product.id,
        productName: product.name,
        unitPrice: new Prisma.Decimal(unitPrice.toFixed(2)),
        quantity: requested.quantity,
        lineTotal: new Prisma.Decimal(
          (unitPrice * requested.quantity).toFixed(2),
        ),
        options: {
          create: selectedOptions.map(({ group, option }) => ({
            optionId: option.id,
            groupName: group.name,
            optionName: option.name,
            priceDelta: new Prisma.Decimal(
              (Number(option.priceDelta) * multiplier).toFixed(2),
            ),
          })),
        },
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
        items: { include: { options: true } },
      },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
