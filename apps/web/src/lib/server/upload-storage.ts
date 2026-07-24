import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./prisma";

export const UPLOAD_FILENAME_PATTERN = /^[0-9a-f-]+\.(?:gif|jpe?g|png|webp)$/i;

export function getUploadDirectory() {
  return (
    process.env.UPLOAD_DIRECTORY ??
    path.join(process.cwd(), "public", "uploads")
  );
}

export async function inspectUploadStorage() {
  try {
    const directory = getUploadDirectory();
    const names = (await readdir(directory)).filter(
      (name) => name !== ".gitkeep" && UPLOAD_FILENAME_PATTERN.test(name),
    );
    const files = await Promise.all(
      names.map(async (name) => ({
        name,
        size: (await stat(path.join(directory, name))).size,
      })),
    );
    return { files };
  } catch {
    return { files: [] };
  }
}

export async function getReferencedUploadUrls() {
  const [stores, products] = await Promise.all([
    prisma.store.findMany({
      select: {
        logoUrl: true,
        coverImageUrl: true,
        promotionImageUrl: true,
      },
    }),
    prisma.product.findMany({ select: { imageUrl: true } }),
  ]);

  return [
    ...stores.flatMap((store) => [
      store.logoUrl,
      store.coverImageUrl,
      store.promotionImageUrl,
    ]),
    ...products.map((product) => product.imageUrl),
  ].filter((value): value is string => Boolean(value?.startsWith("/uploads/")));
}
