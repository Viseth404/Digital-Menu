import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireManagedProduct } from "@/features/stores/merchant-access";
import { deleteUploadIfUnreferenced } from "@/features/subscriptions/server/quotas";
import {
  productOptionInclude,
  readProductOptionGroups,
} from "@/features/stores/product-options";
import {
  assertOptionalImageUrl,
  readBoolean,
  readNonNegativeNumber,
  readNullableString,
  readNumber,
  readObject,
  readString,
} from "@/lib/server/validation";

type Context = { params: Promise<{ storeId: string; productId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { storeId, productId } = await context.params;
    const existing = await requireManagedProduct(request, storeId, productId);
    const body = readObject(await request.json());
    const sortOrder = readNonNegativeNumber(body, "sortOrder");
    const categoryId = readNullableString(body, "categoryId");
    if (
      categoryId &&
      !(await prisma.category.findFirst({ where: { id: categoryId, storeId } }))
    ) {
      throw new ApiException("Category not found", 400);
    }
    const data: Prisma.ProductUpdateInput = {
      name: readString(body, "name", { min: 2, optional: true }),
      nameKh: readNullableString(body, "nameKh"),
      description: readNullableString(body, "description"),
      descriptionKh: readNullableString(body, "descriptionKh"),
      price: readNumber(body, "price"),
      imageUrl: assertOptionalImageUrl(
        readNullableString(body, "imageUrl"),
        "imageUrl",
      ),
      isAvailable: readBoolean(body, "isAvailable"),
      sortOrder:
        sortOrder === undefined
          ? undefined
          : Math.max(0, Math.round(sortOrder)),
      category:
        categoryId === undefined
          ? undefined
          : categoryId
            ? { connect: { id: categoryId } }
            : { disconnect: true },
      optionGroups:
        body.optionGroups === undefined
          ? undefined
          : {
              deleteMany: {},
              create: readProductOptionGroups(body.optionGroups) ?? [],
            },
    };
    const product = await prisma.product.update({
      where: { id: productId },
      data,
      include: {
        category: { select: { id: true, name: true } },
        ...productOptionInclude,
      },
    });
    if (existing.imageUrl && existing.imageUrl !== product.imageUrl) {
      await deleteUploadIfUnreferenced(existing.imageUrl, existing.merchantId);
    }
    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { storeId, productId } = await context.params;
    const product = await requireManagedProduct(request, storeId, productId);
    await prisma.product.delete({ where: { id: productId } });
    await deleteUploadIfUnreferenced(product.imageUrl, product.merchantId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
