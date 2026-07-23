import "server-only";

import { MerchantMemberRole, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { ApiException } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";

const managementRoles: MerchantMemberRole[] = [
  MerchantMemberRole.OWNER,
  MerchantMemberRole.MANAGER,
];

export async function requireManagedStore(
  request: NextRequest,
  storeId: string,
) {
  const user = await requireRequestUser(request, [UserRole.MERCHANT]);
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      merchant: {
        members: {
          some: { userId: user.id, role: { in: managementRoles } },
        },
      },
    },
  });

  if (!store) throw new ApiException("Store not found", 404);
  return store;
}

export async function requireStoreAccess(
  request: NextRequest,
  storeId: string,
) {
  const user = await requireRequestUser(request, [
    UserRole.MERCHANT,
    UserRole.STAFF,
  ]);
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      merchant: { members: { some: { userId: user.id } } },
    },
  });
  if (!store) throw new ApiException("Store not found", 404);
  return store;
}

export async function requireManagedProduct(
  request: NextRequest,
  storeId: string,
  productId: string,
) {
  await requireManagedStore(request, storeId);
  const product = await prisma.product.findFirst({
    where: { id: productId, storeId },
  });
  if (!product) throw new ApiException("Product not found", 404);
  return product;
}

export async function requireManagedCategory(
  request: NextRequest,
  storeId: string,
  categoryId: string,
) {
  await requireManagedStore(request, storeId);
  const category = await prisma.category.findFirst({
    where: { id: categoryId, storeId },
  });
  if (!category) throw new ApiException("Category not found", 404);
  return category;
}
