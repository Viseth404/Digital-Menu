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

export async function getPlatformServiceCredentials() {
  const settings = await prisma.platformSetting.upsert({
    where: { id: "platform" },
    create: { id: "platform" },
    update: {},
    select: {
      telegramBotToken: true,
      removeBgApiKey: true,
    },
  });
  return {
    telegramBotToken:
      settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || null,
    removeBgApiKey:
      settings.removeBgApiKey || process.env.REMOVE_BG_API_KEY || null,
  };
}
