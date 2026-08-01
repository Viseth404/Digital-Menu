import "server-only";

import { stat, unlink } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { ApiException } from "@/lib/server/api-response";
import {
  getUploadDirectory,
  UPLOAD_FILENAME_PATTERN,
} from "@/lib/server/upload-storage";
import { prisma } from "@/lib/server/prisma";

export const BYTES_PER_MB = 1024 * 1024;

export type MerchantQuota = {
  products: { used: number; limit: number };
  storage: { usedBytes: number; limitBytes: number };
};

export async function lockMerchantQuota(
  transaction: Prisma.TransactionClient,
  merchantId: string,
) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${merchantId}))`;
}

export async function assertCanCreateProduct(
  transaction: Prisma.TransactionClient,
  merchantId: string,
) {
  const subscription = await transaction.merchantSubscription.findUnique({
    where: { merchantId },
    select: { plan: { select: { maxProducts: true } } },
  });
  if (!subscription) {
    throw new ApiException(
      "Assign an active subscription plan before adding products",
      402,
    );
  }

  const used = await transaction.product.count({
    where: { store: { merchantId } },
  });
  if (used >= subscription.plan.maxProducts) {
    throw new ApiException(
      `Product limit reached (${used}/${subscription.plan.maxProducts}). Delete a product or upgrade the subscription plan.`,
      409,
    );
  }
}

export async function synchronizeMerchantUploadAssets(merchantId: string) {
  const stores = await prisma.store.findMany({
    where: { merchantId },
    select: {
      logoUrl: true,
      coverImageUrl: true,
      promotionImageUrl: true,
      products: { select: { imageUrl: true } },
    },
  });
  const filenames = new Set(
    stores
      .flatMap((store) => [
        store.logoUrl,
        store.coverImageUrl,
        store.promotionImageUrl,
        ...store.products.map((product) => product.imageUrl),
      ])
      .map(getUploadFilename)
      .filter((filename): filename is string => Boolean(filename)),
  );
  if (!filenames.size) return;

  const existing = new Set(
    (
      await prisma.uploadAsset.findMany({
        where: { filename: { in: [...filenames] } },
        select: { filename: true },
      })
    ).map((asset) => asset.filename),
  );
  const missing = [...filenames].filter((filename) => !existing.has(filename));
  if (!missing.length) return;

  const uploadDirectory = getUploadDirectory();
  const assets = (
    await Promise.all(
      missing.map(async (filename) => {
        try {
          return {
            merchantId,
            filename,
            sizeBytes: (await stat(path.join(uploadDirectory, filename))).size,
          };
        } catch {
          return null;
        }
      }),
    )
  ).filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));

  if (assets.length) {
    await prisma.uploadAsset.createMany({ data: assets, skipDuplicates: true });
  }
}

export async function getMerchantQuota(
  merchantId: string,
): Promise<MerchantQuota> {
  await synchronizeMerchantUploadAssets(merchantId);
  const [subscription, productUsed, storage] = await Promise.all([
    prisma.merchantSubscription.findUnique({
      where: { merchantId },
      select: {
        plan: { select: { maxProducts: true, storageMb: true } },
      },
    }),
    prisma.product.count({ where: { store: { merchantId } } }),
    prisma.uploadAsset.aggregate({
      where: { merchantId },
      _sum: { sizeBytes: true },
    }),
  ]);
  if (!subscription) {
    throw new ApiException("Merchant does not have a subscription plan", 409);
  }

  return {
    products: { used: productUsed, limit: subscription.plan.maxProducts },
    storage: {
      usedBytes: storage._sum.sizeBytes ?? 0,
      limitBytes: subscription.plan.storageMb * BYTES_PER_MB,
    },
  };
}

export async function reserveUploadAsset(input: {
  merchantId: string;
  filename: string;
  sizeBytes: number;
}) {
  await synchronizeMerchantUploadAssets(input.merchantId);
  return prisma.$transaction(async (transaction) => {
    await lockMerchantQuota(transaction, input.merchantId);
    const subscription = await transaction.merchantSubscription.findUnique({
      where: { merchantId: input.merchantId },
      select: { plan: { select: { storageMb: true } } },
    });
    if (!subscription) {
      throw new ApiException(
        "Assign an active subscription plan before uploading images",
        402,
      );
    }
    const storage = await transaction.uploadAsset.aggregate({
      where: { merchantId: input.merchantId },
      _sum: { sizeBytes: true },
    });
    const usedBytes = storage._sum.sizeBytes ?? 0;
    const limitBytes = subscription.plan.storageMb * BYTES_PER_MB;
    if (usedBytes + input.sizeBytes > limitBytes) {
      throw new ApiException(
        `Storage limit reached (${formatMegabytes(usedBytes)}/${formatMegabytes(limitBytes)}). Delete unused images or upgrade the subscription plan.`,
        409,
      );
    }

    await transaction.uploadAsset.create({
      data: input,
    });
    return { usedBytes: usedBytes + input.sizeBytes, limitBytes };
  });
}

export async function deleteUploadIfUnreferenced(
  url: string | null | undefined,
  merchantId: string,
) {
  const filename = getUploadFilename(url);
  if (!filename) return false;
  const referenced = await prisma.$transaction(async (transaction) => {
    const [stores, products] = await Promise.all([
      transaction.store.count({
        where: {
          merchantId,
          OR: [
            { logoUrl: url },
            { coverImageUrl: url },
            { promotionImageUrl: url },
          ],
        },
      }),
      transaction.product.count({
        where: { imageUrl: url, store: { merchantId } },
      }),
    ]);
    return stores + products > 0;
  });
  if (referenced) return false;

  try {
    await unlink(path.join(getUploadDirectory(), filename));
  } catch (error) {
    if (!(
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    )) {
      console.error("Unable to remove unreferenced upload", filename, error);
      return false;
    }
  }
  await prisma.uploadAsset.deleteMany({ where: { merchantId, filename } });
  return true;
}

export function getUploadFilename(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/")) return null;
  const filename = url.slice("/uploads/".length);
  return UPLOAD_FILENAME_PATTERN.test(filename) ? filename : null;
}

export function formatMegabytes(bytes: number) {
  const megabytes = bytes / BYTES_PER_MB;
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`;
}
