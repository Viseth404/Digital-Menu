import {
  BillingInterval,
  OnboardingStatus,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
  UserRole,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { writeAdminAudit } from "@/features/admin-support/server/audit";
import { ApiException, handleApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { requireRequestUser } from "@/lib/server/session";
import {
  readNullableString,
  readNumber,
  readObject,
  readString,
} from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    const now = new Date();
    const [
      plans,
      merchants,
      payments,
      sessions,
      users,
      lockedUsers,
      expiredSubscriptions,
    ] = await Promise.all([
      prisma.subscriptionPlan.findMany({ orderBy: { monthlyPrice: "asc" } }),
      prisma.merchant.findMany({
        include: {
          subscription: { include: { plan: true } },
          _count: { select: { stores: true, members: true, payments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subscriptionPayment.findMany({
        take: 50,
        include: { merchant: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.session.findMany({
        where: { expiresAt: { gt: now }, revokedAt: null },
        take: 100,
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
        orderBy: { lastSeenAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: { not: UserRole.ADMIN } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          lastLoginAt: true,
          deletedAt: true,
          deletedReason: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { lockedUntil: { gt: now } } }),
      prisma.merchantSubscription.count({
        where: {
          currentPeriodEnd: { lt: now },
          status: { in: ["ACTIVE", "TRIAL"] },
        },
      }),
    ]);

    return NextResponse.json({
      plans,
      merchants,
      payments,
      sessions,
      users,
      monitoring: {
        lockedUsers,
        expiredSubscriptions,
        pendingOnboarding: merchants.filter(
          (merchant) => merchant.onboardingStatus === "READY_FOR_REVIEW",
        ).length,
        deletedMerchants: merchants.filter((merchant) => merchant.deletedAt)
          .length,
        activeSessions: sessions.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRequestUser(request, [UserRole.ADMIN]);
    const body = readObject(await request.json());
    const action = readString(body, "action")!;
    let result: unknown;
    let targetType = "PLATFORM";
    let targetId: string | undefined;
    let targetName: string | undefined;

    if (action === "CREATE_PLAN") {
      result = await prisma.subscriptionPlan.create({
        data: {
          name: readString(body, "name", { min: 2 })!,
          description: readNullableString(body, "description"),
          monthlyPrice: readNumber(body, "monthlyPrice")!,
          yearlyPrice: readNumber(body, "yearlyPrice")!,
          maxStores: readPositiveInteger(body, "maxStores"),
          maxProducts: readPositiveInteger(body, "maxProducts"),
          maxUsers: readPositiveInteger(body, "maxUsers"),
          storageMb: readPositiveInteger(body, "storageMb"),
        },
      });
      targetType = "SUBSCRIPTION_PLAN";
      targetId = (result as { id: string }).id;
      targetName = (result as { name: string }).name;
    } else if (action === "ASSIGN_PLAN") {
      const merchantId = readString(body, "merchantId")!;
      const planId = readString(body, "planId")!;
      const interval = readEnum(body, "billingInterval", BillingInterval);
      const status = readEnum(body, "status", SubscriptionStatus);
      const start = new Date();
      const end = new Date(start);
      if (interval === "YEARLY") end.setFullYear(end.getFullYear() + 1);
      else end.setMonth(end.getMonth() + 1);
      result = await prisma.merchantSubscription.upsert({
        where: { merchantId },
        create: {
          merchantId,
          planId,
          billingInterval: interval,
          status,
          currentPeriodStart: start,
          currentPeriodEnd: end,
        },
        update: {
          planId,
          billingInterval: interval,
          status,
          currentPeriodStart: start,
          currentPeriodEnd: end,
          cancelledAt: null,
        },
      });
      targetType = "MERCHANT_SUBSCRIPTION";
      targetId = merchantId;
    } else if (action === "RECORD_PAYMENT") {
      const merchantId = readString(body, "merchantId")!;
      const paymentStatus = readEnum(body, "status", PaymentStatus);
      const subscription = await prisma.merchantSubscription.findUnique({
        where: { merchantId },
        select: { id: true },
      });
      result = await prisma.subscriptionPayment.create({
        data: {
          merchantId,
          subscriptionId: subscription?.id,
          amount: readNumber(body, "amount")!,
          currency: readString(body, "currency") ?? "USD",
          method: readEnum(body, "method", PaymentMethod),
          status: paymentStatus,
          reference: readNullableString(body, "reference"),
          note: readNullableString(body, "note"),
          paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,
        },
      });
      targetType = "SUBSCRIPTION_PAYMENT";
      targetId = (result as { id: string }).id;
    } else if (action === "UPDATE_ONBOARDING") {
      const merchantId = readString(body, "merchantId")!;
      const onboardingStatus = readEnum(
        body,
        "onboardingStatus",
        OnboardingStatus,
      );
      result = await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          onboardingStatus,
          onboardingNotes: readNullableString(body, "notes"),
          approvedAt: onboardingStatus === "APPROVED" ? new Date() : undefined,
          status:
            onboardingStatus === "APPROVED"
              ? "ACTIVE"
              : onboardingStatus === "REJECTED"
                ? "SUSPENDED"
                : undefined,
        },
      });
      targetType = "MERCHANT_ONBOARDING";
      targetId = merchantId;
    } else if (
      action === "SOFT_DELETE_MERCHANT" ||
      action === "RESTORE_MERCHANT"
    ) {
      const merchantId = readString(body, "merchantId")!;
      const deleting = action === "SOFT_DELETE_MERCHANT";
      result = await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          deletedAt: deleting ? new Date() : null,
          deletedReason: deleting
            ? readString(body, "reason", { min: 3 })
            : null,
          status: deleting ? "SUSPENDED" : "ACTIVE",
          stores: { updateMany: { where: {}, data: { isPublished: false } } },
        },
      });
      targetType = "MERCHANT";
      targetId = merchantId;
    } else if (action === "SOFT_DELETE_USER" || action === "RESTORE_USER") {
      const userId = readString(body, "userId")!;
      const deleting = action === "SOFT_DELETE_USER";
      result = await prisma.user.update({
        where: { id: userId, role: { not: UserRole.ADMIN } },
        data: {
          deletedAt: deleting ? new Date() : null,
          deletedReason: deleting
            ? readString(body, "reason", { min: 3 })
            : null,
          isActive: !deleting,
          sessions: deleting
            ? {
                updateMany: {
                  where: { revokedAt: null },
                  data: { revokedAt: new Date() },
                },
              }
            : undefined,
        },
      });
      targetType = "USER";
      targetId = userId;
    } else if (action === "REVOKE_SESSION") {
      const sessionId = readString(body, "sessionId")!;
      result = await prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
      targetType = "SESSION";
      targetId = sessionId;
    } else if (action === "PREVIEW_MERCHANT") {
      const merchantId = readString(body, "merchantId")!;
      result = await prisma.merchant.findUniqueOrThrow({
        where: { id: merchantId },
        include: {
          subscription: { include: { plan: true } },
          stores: {
            include: {
              _count: {
                select: { products: true, orders: true, tables: true },
              },
            },
          },
          members: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  isActive: true,
                  lastLoginAt: true,
                },
              },
            },
          },
        },
      });
      targetType = "MERCHANT_PREVIEW";
      targetId = merchantId;
    } else {
      throw new ApiException("Unsupported operations action", 400);
    }

    await writeAdminAudit(prisma, {
      adminId: admin.id,
      action,
      targetType,
      targetId,
      targetName,
      details: { readOnly: action === "PREVIEW_MERCHANT" },
      request,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

function readPositiveInteger(body: Record<string, unknown>, key: string) {
  const value = readNumber(body, key);
  if (!value || !Number.isInteger(value) || value < 1) {
    throw new ApiException(`${key} must be a positive integer`, 400);
  }
  return value;
}

function readEnum<T extends Record<string, string>>(
  body: Record<string, unknown>,
  key: string,
  values: T,
) {
  const value = readString(body, key)!;
  if (!Object.values(values).includes(value)) {
    throw new ApiException(`Invalid ${key}`, 400);
  }
  return value as T[keyof T];
}
