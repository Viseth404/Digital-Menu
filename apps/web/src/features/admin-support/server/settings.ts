import "server-only";

import { prisma } from "@/lib/server/prisma";

export function getPublicPlatformSettings() {
  return prisma.platformSetting.upsert({
    where: { id: "platform" },
    create: { id: "platform" },
    update: {},
    select: {
      maintenanceMode: true,
      announcement: true,
      supportEmail: true,
    },
  });
}

export function getPlatformOperationalSettings() {
  return prisma.platformSetting.upsert({
    where: { id: "platform" },
    create: { id: "platform" },
    update: {},
    select: {
      uploadLimitMb: true,
      sessionDurationDays: true,
      defaultCurrency: true,
    },
  });
}
