import {
  BillingInterval,
  OnboardingStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
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
import {
  getSubscriptionGraceEndsAt,
  SUBSCRIPTION_GRACE_PERIOD_DAYS,
  synchronizeAllSubscriptionLifecycles,
} from "@/features/subscriptions/server/lifecycle";
import { getMerchantQuota } from "@/features/subscriptions/server/quotas";

export async function GET(request: NextRequest) {
  try {
    await requireRequestUser(request, [UserRole.ADMIN]);
    const now = new Date();
    await synchronizeAllSubscriptionLifecycles(now);
    const dueSoonAt = new Date(now);
    dueSoonAt.setUTCDate(dueSoonAt.getUTCDate() + 7);
    const [
      plans,
      merchants,
      payments,
      sessions,
      users,
      lockedUsers,
      expiredSubscriptions,
      dueSoonSubscriptions,
      pastDueSubscriptions,
    ] = await Promise.all([
      prisma.subscriptionPlan.findMany({
        include: { _count: { select: { subscriptions: true } } },
        orderBy: [{ isActive: "desc" }, { monthlyPrice: "asc" }],
      }),
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
        where: { status: SubscriptionStatus.EXPIRED },
      }),
      prisma.merchantSubscription.count({
        where: {
          currentPeriodEnd: { gte: now, lte: dueSoonAt },
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
          },
        },
      }),
      prisma.merchantSubscription.count({
        where: { status: SubscriptionStatus.PAST_DUE },
      }),
    ]);

    const merchantsWithQuota = await Promise.all(
      merchants.map(async (merchant) => ({
        ...merchant,
        quota: merchant.subscription
          ? await getMerchantQuota(merchant.id)
          : null,
        subscription: merchant.subscription
          ? {
              ...merchant.subscription,
              graceEndsAt: getSubscriptionGraceEndsAt(
                merchant.subscription.currentPeriodEnd,
              ),
            }
          : null,
      })),
    );

    return NextResponse.json({
      plans,
      merchants: merchantsWithQuota,
      payments,
      sessions,
      users,
      billingPolicy: {
        gracePeriodDays: SUBSCRIPTION_GRACE_PERIOD_DAYS,
      },
      monitoring: {
        lockedUsers,
        expiredSubscriptions,
        dueSoonSubscriptions,
        pastDueSubscriptions,
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
    let auditDetails: Prisma.InputJsonValue | undefined;

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
    } else if (action === "UPDATE_PLAN") {
      const planId = readString(body, "planId")!;
      result = await prisma.subscriptionPlan.update({
        where: { id: planId },
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
      targetId = planId;
      targetName = (result as { name: string }).name;
    } else if (action === "SET_PLAN_ACTIVE") {
      const planId = readString(body, "planId")!;
      const isActive = readBoolean(body, "isActive");
      result = await prisma.subscriptionPlan.update({
        where: { id: planId },
        data: { isActive },
      });
      targetType = "SUBSCRIPTION_PLAN";
      targetId = planId;
    } else if (action === "DELETE_PLAN") {
      const planId = readString(body, "planId")!;
      const plan = await prisma.subscriptionPlan.findUniqueOrThrow({
        where: { id: planId },
        select: {
          name: true,
          _count: { select: { subscriptions: true } },
        },
      });
      if (plan._count.subscriptions > 0) {
        throw new ApiException(
          "This plan is assigned to merchants. Deactivate it instead to preserve billing history.",
          409,
        );
      }
      result = await prisma.subscriptionPlan.delete({
        where: { id: planId },
      });
      targetType = "SUBSCRIPTION_PLAN";
      targetId = planId;
      targetName = plan.name;
    } else if (action === "ASSIGN_PLAN") {
      const merchantId = readString(body, "merchantId")!;
      const planId = readString(body, "planId")!;
      const interval = readEnum(body, "billingInterval", BillingInterval);
      const status = readEnum(body, "status", SubscriptionStatus);
      const start = new Date();
      const end = addBillingInterval(start, interval);
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
      const amount = readNumber(body, "amount")!;
      if (amount < 0.01) {
        throw new ApiException("Payment amount must be at least 0.01", 400);
      }
      const paidAt = paymentStatus === PaymentStatus.PAID ? new Date() : null;
      result = await prisma.$transaction(async (transaction) => {
        const subscription = await transaction.merchantSubscription.findUnique({
          where: { merchantId },
          select: {
            id: true,
            status: true,
            billingInterval: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
          },
        });
        if (!subscription) {
          throw new ApiException(
            "Assign a subscription plan before recording a payment",
            409,
          );
        }

        const priorPaidPayments = await transaction.subscriptionPayment.count({
          where: {
            subscriptionId: subscription.id,
            status: PaymentStatus.PAID,
          },
        });
        const payment = await transaction.subscriptionPayment.create({
          data: {
            merchantId,
            subscriptionId: subscription.id,
            amount,
            currency: readString(body, "currency") ?? "USD",
            method: readEnum(body, "method", PaymentMethod),
            status: paymentStatus,
            reference: readNullableString(body, "reference"),
            note: readNullableString(body, "note"),
            paidAt,
          },
        });

        if (paidAt) {
          const shouldStartNewPeriod =
            priorPaidPayments > 0 || subscription.currentPeriodEnd <= paidAt;
          const periodStart = shouldStartNewPeriod
            ? subscription.currentPeriodEnd > paidAt
              ? subscription.currentPeriodEnd
              : paidAt
            : subscription.currentPeriodStart;
          const periodEnd = shouldStartNewPeriod
            ? addBillingInterval(periodStart, subscription.billingInterval)
            : subscription.currentPeriodEnd;

          await transaction.merchantSubscription.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              cancelledAt: null,
            },
          });
          auditDetails = {
            amount,
            renewalApplied: shouldStartNewPeriod,
            previousStatus: subscription.status,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
          };
        } else {
          auditDetails = { amount, renewalApplied: false };
        }
        return payment;
      });
      targetType = "SUBSCRIPTION_PAYMENT";
      targetId = (result as { id: string }).id;
    } else if (action === "DELETE_PAYMENT") {
      const paymentId = readString(body, "paymentId")!;
      const payment = await prisma.subscriptionPayment.findUniqueOrThrow({
        where: { id: paymentId },
        include: { merchant: { select: { name: true } } },
      });
      await prisma.subscriptionPayment.delete({ where: { id: paymentId } });
      result = { deleted: true, id: paymentId };
      targetType = "SUBSCRIPTION_PAYMENT";
      targetId = paymentId;
      targetName = payment.merchant.name;
      auditDetails = {
        amount: payment.amount.toString(),
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        reference: payment.reference,
        paidAt: payment.paidAt?.toISOString() ?? null,
        subscriptionDatesChanged: false,
      };
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
      details: auditDetails ?? { readOnly: action === "PREVIEW_MERCHANT" },
      request,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

function addBillingInterval(start: Date, interval: BillingInterval) {
  if (interval === BillingInterval.YEARLY) {
    const end = new Date(start);
    end.setUTCFullYear(end.getUTCFullYear() + 1);
    return end;
  }

  const end = new Date(start);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const lastDay = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
  ).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return end;
}

function readPositiveInteger(body: Record<string, unknown>, key: string) {
  const value = readNumber(body, key);
  if (!value || !Number.isInteger(value) || value < 1) {
    throw new ApiException(`${key} must be a positive integer`, 400);
  }
  return value;
}

function readBoolean(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value !== "boolean") {
    throw new ApiException(`${key} must be a boolean`, 400);
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
