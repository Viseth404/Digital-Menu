import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireManagedStore } from "@/features/stores/merchant-access";
import {
  assertOptionalImageUrl,
  readBoolean,
  readNonNegativeNumber,
  readNullableString,
  readNumber,
  readObject,
  readString,
} from "@/lib/server/validation";

type Context = { params: Promise<{ storeId: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const { storeId } = await context.params;
    await requireManagedStore(request, storeId);
    const products = await prisma.product.findMany({
      where: { storeId },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(products);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { storeId } = await context.params;
    await requireManagedStore(request, storeId);
    const body = readObject(await request.json());
    const categoryId = readNullableString(body, "categoryId");
    if (
      categoryId &&
      !(await prisma.category.findFirst({ where: { id: categoryId, storeId } }))
    ) {
      throw new ApiException("Category not found", 400);
    }
    const product = await prisma.product.create({
      data: {
        storeId,
        categoryId,
        name: readString(body, "name", { min: 2 })!,
        description: readNullableString(body, "description"),
        price: readNumber(body, "price")!,
        imageUrl: assertOptionalImageUrl(
          readNullableString(body, "imageUrl"),
          "imageUrl",
        ),
        isAvailable: readBoolean(body, "isAvailable") ?? true,
        sortOrder: Math.round(readNonNegativeNumber(body, "sortOrder") ?? 0),
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
