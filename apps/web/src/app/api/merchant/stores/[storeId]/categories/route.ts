import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireManagedStore } from "@/features/stores/merchant-access";
import {
  readBoolean,
  readNonNegativeNumber,
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
      await prisma.category.findMany({
        where: { storeId },
        include: { _count: { select: { products: true } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { storeId } = await context.params;
    await requireManagedStore(request, storeId);
    const body = readObject(await request.json());
    const category = await prisma.category.create({
      data: {
        storeId,
        name: readString(body, "name", { min: 2 })!,
        description: readNullableString(body, "description"),
        isActive: readBoolean(body, "isActive") ?? true,
        sortOrder: Math.round(readNonNegativeNumber(body, "sortOrder") ?? 0),
      },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
