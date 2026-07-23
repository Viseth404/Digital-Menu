import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireManagedStore } from "@/features/stores/merchant-access";
import { STORE_THEME } from "@/features/stores/constants";
import {
  assertOptionalImageUrl,
  assertOptionalUrl,
  readBoolean,
  readNullableString,
  readNumber,
  readObject,
  readString,
} from "@/lib/server/validation";

type StoreRouteContext = { params: Promise<{ storeId: string }> };

export async function PATCH(request: NextRequest, context: StoreRouteContext) {
  try {
    const { storeId } = await context.params;
    const store = await requireManagedStore(request, storeId);

    const body = readObject(await request.json());
    const merchant = await prisma.merchant.findUniqueOrThrow({
      where: { id: store.merchantId },
      select: {
        name: true,
        slug: true,
        contactEmail: true,
        phone: true,
      },
    });
    const currency = readString(body, "currency", { optional: true });
    if (currency && !/^[A-Z]{3}$/.test(currency)) {
      throw new ApiException("currency must be a three-letter code", 400);
    }
    const readColor = (key: string) => {
      const value = readString(body, key, { optional: true });
      if (value && !new RegExp(STORE_THEME.hexColorPattern, "i").test(value)) {
        throw new ApiException(`${key} must be a 6-digit hex color`, 400);
      }
      return value?.toUpperCase();
    };

    const data: Prisma.StoreUpdateInput = {
      name: merchant.name,
      slug: merchant.slug,
      description: readNullableString(body, "description"),
      address: readNullableString(body, "address"),
      phone: merchant.phone,
      email: merchant.contactEmail,
      logoUrl: assertOptionalImageUrl(
        readNullableString(body, "logoUrl"),
        "logoUrl",
      ),
      coverImageUrl: assertOptionalImageUrl(
        readNullableString(body, "coverImageUrl"),
        "coverImageUrl",
      ),
      primaryColor: readColor("primaryColor"),
      accentColor: readColor("accentColor"),
      facebookUrl: assertOptionalUrl(
        readNullableString(body, "facebookUrl"),
        "facebookUrl",
      ),
      instagramUrl: assertOptionalUrl(
        readNullableString(body, "instagramUrl"),
        "instagramUrl",
      ),
      telegramUrl: assertOptionalUrl(
        readNullableString(body, "telegramUrl"),
        "telegramUrl",
      ),
      tiktokUrl: assertOptionalUrl(
        readNullableString(body, "tiktokUrl"),
        "tiktokUrl",
      ),
      currency,
      exchangeRate: readNumber(body, "exchangeRate"),
      isPublished: readBoolean(body, "isPublished"),
    };

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data,
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: { select: { products: true } },
      },
    });
    return NextResponse.json(updatedStore);
  } catch (error) {
    return handleApiError(error);
  }
}
