import { OrderingMode, StoreStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import {
  readBoolean,
  readNullableString,
  readObject,
  readString,
} from "@/lib/server/validation";

type Context = { params: Promise<{ storeId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const { storeId } = await context.params;
    const body = readObject(await request.json());
    const value = readString(body, "status", { optional: true });
    const status = value as StoreStatus | undefined;
    if (status && !Object.values(StoreStatus).includes(status)) {
      throw new ApiException("Invalid store status", 400);
    }
    const existing = await prisma.store.findUniqueOrThrow({
      where: { id: storeId },
      select: {
        name: true,
        status: true,
        isPublished: true,
        allowSharedQrOrdering: true,
        allowTableOrdering: true,
        allowTelegramAlerts: true,
        allowKitchenBoard: true,
        orderingMode: true,
        telegramAlertsEnabled: true,
        telegramChatId: true,
      },
    });
    const allowSharedQrOrdering = readBoolean(body, "allowSharedQrOrdering");
    const allowTableOrdering = readBoolean(body, "allowTableOrdering");
    const allowTelegramAlerts = readBoolean(body, "allowTelegramAlerts");
    const allowKitchenBoard = readBoolean(body, "allowKitchenBoard");
    const orderingModeValue = readString(body, "orderingMode", {
      optional: true,
    });
    const requestedOrderingMode = orderingModeValue as OrderingMode | undefined;
    if (
      requestedOrderingMode &&
      !Object.values(OrderingMode).includes(requestedOrderingMode)
    ) {
      throw new ApiException("Invalid ordering mode", 400);
    }
    const telegramAlertsEnabled = readBoolean(body, "telegramAlertsEnabled");
    const telegramChatId = readNullableString(body, "telegramChatId");
    if (telegramChatId && !/^-?\d+$/.test(telegramChatId)) {
      throw new ApiException("Telegram chat ID must contain only digits", 400);
    }
    const result = await prisma.$transaction(async (transaction) => {
      const permissions = {
        allowSharedQrOrdering:
          allowSharedQrOrdering ?? existing.allowSharedQrOrdering,
        allowTableOrdering: allowTableOrdering ?? existing.allowTableOrdering,
        allowTelegramAlerts:
          allowTelegramAlerts ?? existing.allowTelegramAlerts,
        allowKitchenBoard: allowKitchenBoard ?? existing.allowKitchenBoard,
      };
      let orderingMode = requestedOrderingMode ?? existing.orderingMode;
      if (
        requestedOrderingMode === OrderingMode.SHARED_QR &&
        !permissions.allowSharedQrOrdering
      ) {
        throw new ApiException(
          "Enable shared QR permission before selecting shared QR mode",
          400,
        );
      }
      if (
        requestedOrderingMode === OrderingMode.TABLE_QR &&
        !permissions.allowTableOrdering
      ) {
        throw new ApiException(
          "Enable table ordering permission before selecting table QR mode",
          400,
        );
      }
      const nextTelegramChatId =
        telegramChatId === undefined ? existing.telegramChatId : telegramChatId;
      const nextTelegramEnabled =
        telegramAlertsEnabled ?? existing.telegramAlertsEnabled;
      if (nextTelegramEnabled && !permissions.allowTelegramAlerts) {
        throw new ApiException(
          "Enable Telegram permission before turning on alerts",
          400,
        );
      }
      if (nextTelegramEnabled && !nextTelegramChatId) {
        throw new ApiException(
          "Telegram group chat ID is required when alerts are enabled",
          400,
        );
      }
      if (
        orderingMode === OrderingMode.SHARED_QR &&
        !permissions.allowSharedQrOrdering
      ) {
        orderingMode = permissions.allowTableOrdering
          ? OrderingMode.TABLE_QR
          : OrderingMode.MENU_ONLY;
      }
      if (
        orderingMode === OrderingMode.TABLE_QR &&
        !permissions.allowTableOrdering
      ) {
        orderingMode = permissions.allowSharedQrOrdering
          ? OrderingMode.SHARED_QR
          : OrderingMode.MENU_ONLY;
      }
      const updated = await transaction.store.update({
        where: { id: storeId },
        data: {
          status,
          isPublished: readBoolean(body, "isPublished"),
          ...permissions,
          orderingMode,
          telegramAlertsEnabled: permissions.allowTelegramAlerts
            ? nextTelegramEnabled
            : false,
          telegramChatId: nextTelegramChatId,
        },
        select: {
          id: true,
          status: true,
          isPublished: true,
          allowSharedQrOrdering: true,
          allowTableOrdering: true,
          allowTelegramAlerts: true,
          allowKitchenBoard: true,
          orderingMode: true,
          telegramAlertsEnabled: true,
          telegramChatId: true,
        },
      });
      await writeAdminAudit(transaction, {
        adminId: admin.id,
        action: "STORE_STATE_CHANGED",
        targetType: "STORE",
        targetId: storeId,
        targetName: existing.name,
        details: {
          before: {
            status: existing.status,
            isPublished: existing.isPublished,
            allowSharedQrOrdering: existing.allowSharedQrOrdering,
            allowTableOrdering: existing.allowTableOrdering,
            allowTelegramAlerts: existing.allowTelegramAlerts,
            allowKitchenBoard: existing.allowKitchenBoard,
            telegramAlertsEnabled: existing.telegramAlertsEnabled,
            telegramChatId: existing.telegramChatId,
          },
          after: updated,
        },
        request,
      });
      return updated;
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
