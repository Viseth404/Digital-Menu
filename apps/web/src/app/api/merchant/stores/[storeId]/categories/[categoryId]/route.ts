import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireManagedCategory } from "@/features/stores/merchant-access";
import {
  readBoolean,
  readNonNegativeNumber,
  readNullableString,
  readObject,
  readString,
} from "@/lib/server/validation";

type Context = { params: Promise<{ storeId: string; categoryId: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { storeId, categoryId } = await context.params;
    await requireManagedCategory(request, storeId, categoryId);
    const body = readObject(await request.json());
    const sortOrder = readNonNegativeNumber(body, "sortOrder");
    const data: Prisma.CategoryUpdateInput = {
      name: readString(body, "name", { min: 2, optional: true }),
      nameKh: readNullableString(body, "nameKh"),
      description: readNullableString(body, "description"),
      descriptionKh: readNullableString(body, "descriptionKh"),
      isActive: readBoolean(body, "isActive"),
      sortOrder: sortOrder === undefined ? undefined : Math.round(sortOrder),
    };
    return NextResponse.json(
      await prisma.category.update({
        where: { id: categoryId },
        data,
        include: { _count: { select: { products: true } } },
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { storeId, categoryId } = await context.params;
    await requireManagedCategory(request, storeId, categoryId);
    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
