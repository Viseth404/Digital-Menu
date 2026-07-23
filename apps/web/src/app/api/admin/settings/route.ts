import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import {
  assertEmail,
  readBoolean,
  readNullableString,
  readNumber,
  readObject,
  readString,
} from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    return NextResponse.json(await getSettings());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const body = readObject(await request.json());
    const before = await getSettings();
    const supportEmail = readString(body, "supportEmail", { optional: true });
    const defaultCurrency = readString(body, "defaultCurrency", {
      optional: true,
    });
    const updated = await prisma.$transaction(async (transaction) => {
      const value = await transaction.platformSetting.upsert({
        where: { id: "platform" },
        create: {
          id: "platform",
          maintenanceMode: readBoolean(body, "maintenanceMode") ?? false,
          announcement: readNullableString(body, "announcement"),
          supportEmail: supportEmail
            ? assertEmail(supportEmail)
            : "admin@savor.com",
          defaultCurrency: defaultCurrency ?? "USD",
          uploadLimitMb: Math.round(readNumber(body, "uploadLimitMb") ?? 5),
          sessionDurationDays: Math.round(
            readNumber(body, "sessionDurationDays") ?? 7,
          ),
        },
        update: {
          maintenanceMode: readBoolean(body, "maintenanceMode"),
          announcement: readNullableString(body, "announcement"),
          supportEmail: supportEmail ? assertEmail(supportEmail) : undefined,
          defaultCurrency,
          uploadLimitMb: numberOrUndefined(body, "uploadLimitMb"),
          sessionDurationDays: numberOrUndefined(body, "sessionDurationDays"),
        },
      });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "PLATFORM_SETTINGS_UPDATED",
        targetType: "PLATFORM",
        targetId: "platform",
        targetName: "Platform settings",
        details: {
          maintenanceMode: {
            before: before.maintenanceMode,
            after: value.maintenanceMode,
          },
          announcementChanged: before.announcement !== value.announcement,
        },
        request,
      });
      return value;
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

function getSettings() {
  return prisma.platformSetting.upsert({
    where: { id: "platform" },
    create: { id: "platform" },
    update: {},
  });
}

function numberOrUndefined(object: Record<string, unknown>, key: string) {
  const value = readNumber(object, key);
  return value === undefined ? undefined : Math.round(value);
}
