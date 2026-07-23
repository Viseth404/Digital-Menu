import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireManagedStore } from "@/features/stores/merchant-access";
import { readNumber, readObject } from "@/lib/server/validation";

type Context = { params: Promise<{ storeId: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const { storeId } = await context.params;
    await requireManagedStore(request, storeId);
    return NextResponse.json(
      await prisma.diningTable.findMany({
        where: { storeId },
        include: { _count: { select: { orders: true } } },
        orderBy: { number: "asc" },
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
    const number = Math.round(readNumber(body, "number")!);
    const table = await prisma.diningTable.create({
      data: { storeId, number },
      include: { _count: { select: { orders: true } } },
    });
    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
