import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import {
  getReferencedUploadUrls,
  inspectUploadStorage,
} from "@/lib/server/upload-storage";

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    const started = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - started);
    const staleDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      settings,
      merchantsWithoutOwners,
      storesWithoutProducts,
      storesWithoutTables,
      staleActiveOrders,
      imageReferences,
      storage,
    ] = await Promise.all([
      prisma.platformSetting.upsert({
        where: { id: "platform" },
        create: { id: "platform" },
        update: {},
      }),
      prisma.merchant.count({
        where: {
          members: { none: { role: "OWNER", user: { isActive: true } } },
        },
      }),
      prisma.store.count({ where: { products: { none: {} } } }),
      prisma.store.count({ where: { tables: { none: { isActive: true } } } }),
      prisma.order.count({
        where: {
          status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
          createdAt: { lt: staleDate },
        },
      }),
      getReferencedUploadUrls(),
      inspectUploadStorage(),
    ]);
    const referenced = new Set(imageReferences);
    const available = new Set(
      storage.files.map((file) => `/uploads/${file.name}`),
    );
    const orphanedFiles = storage.files
      .filter((file) => !referenced.has(`/uploads/${file.name}`))
      .map((file) => file.name);
    const orphanedBytes = storage.files
      .filter((file) => !referenced.has(`/uploads/${file.name}`))
      .reduce((total, file) => total + file.size, 0);
    const missingFiles = [...referenced]
      .filter((url) => !available.has(url))
      .map((url) => url.replace("/uploads/", ""));
    const warning =
      orphanedFiles.length ||
      missingFiles.length ||
      merchantsWithoutOwners ||
      storesWithoutProducts ||
      storesWithoutTables ||
      staleActiveOrders;

    return NextResponse.json({
      status: warning ? "warning" : "healthy",
      database: { connected: true, latencyMs, schemaReady: true },
      storage: {
        uploadFiles: storage.files.length,
        uploadBytes: storage.files.reduce(
          (total, file) => total + file.size,
          0,
        ),
        referencedFiles: referenced.size,
        orphanedFiles,
        orphanedBytes,
        missingFiles,
      },
      data: {
        merchantsWithoutOwners,
        storesWithoutProducts,
        storesWithoutTables,
        staleActiveOrders,
      },
      backup: {
        configured: Boolean(process.env.BACKUP_STATUS_URL),
        message: process.env.BACKUP_STATUS_URL
          ? "External backup monitoring is configured."
          : "No verifiable backup monitor is configured. Configure BACKUP_STATUS_URL before relying on automated backups.",
      },
      settings,
      version: process.env.npm_package_version ?? "0.1.0",
      checkedAt: new Date(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
