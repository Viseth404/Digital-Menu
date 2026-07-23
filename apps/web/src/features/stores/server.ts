import "server-only";

import { MerchantStatus, StoreStatus } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import type { StorefrontCategory } from "@/features/storefront/types";

export function findPublicStore(merchantSlug: string, storeSlug: string) {
  return prisma.store.findFirst({
    where: {
      slug: storeSlug,
      isPublished: true,
      status: StoreStatus.ACTIVE,
      merchant: { slug: merchantSlug, status: MerchantStatus.ACTIVE },
    },
    include: {
      merchant: {
        select: {
          name: true,
          slug: true,
          contactEmail: true,
          phone: true,
        },
      },
      products: {
        where: { isAvailable: true },
        include: {
          category: {
            select: { id: true, name: true, isActive: true, sortOrder: true },
          },
        },
        orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
      },
    },
  });
}

export function findQrOrderingTable(
  storeId: string,
  tableId?: string,
  token?: string,
) {
  if (!tableId || !token) return null;
  return prisma.diningTable.findFirst({
    where: {
      id: tableId,
      storeId,
      orderToken: token,
      isActive: true,
    },
    select: { id: true, number: true, name: true },
  });
}

type PublicProduct = {
  id: string;
  name: string;
  description: string | null;
  price: { toString(): string };
  imageUrl: string | null;
  category: {
    id: string;
    name: string;
    isActive: boolean;
    sortOrder: number;
  } | null;
};

export function groupPublicProducts(
  products: PublicProduct[],
): StorefrontCategory[] {
  const groups = new Map<string, StorefrontCategory>();

  for (const product of products) {
    const category = product.category?.isActive ? product.category : null;
    const id = category?.id ?? "uncategorized";
    const group = groups.get(id) ?? {
      id,
      name: category?.name ?? "Other items",
      order: category?.sortOrder ?? Number.MAX_SAFE_INTEGER,
      products: [],
    };

    group.products.push({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      imageUrl: product.imageUrl,
    });
    groups.set(id, group);
  }

  return [...groups.values()].sort((a, b) => a.order - b.order);
}
